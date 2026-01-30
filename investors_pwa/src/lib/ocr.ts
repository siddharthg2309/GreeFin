import 'server-only';
import { createRequire } from 'module';

type OcrLoggerMessage = { status: string; progress: number };

type TesseractRecognize = (
  image: Buffer | ArrayBuffer | string,
  lang?: string,
  options?: { logger?: (message: OcrLoggerMessage) => void }
) => Promise<{ data?: { text?: string } }>;

type PdfParseFn = (buffer: Buffer) => Promise<{ text?: string }>;

type PdfTextOptions = {
  itemJoiner?: string;
  lineEnforce?: boolean;
  includeMarkedContent?: boolean;
  disableNormalization?: boolean;
};

type PdfScreenshotOptions = {
  scale?: number;
  desiredWidth?: number;
  imageBuffer?: boolean;
  imageDataUrl?: boolean;
};

type PdfScreenshotPage = {
  data?: Uint8Array;
  dataUrl?: string;
  pageNumber?: number;
};

type PdfScreenshotResult = {
  pages?: PdfScreenshotPage[];
};

type PdfParseConstructor = new (options: { data: Uint8Array | Buffer }) => {
  getText: (options?: PdfTextOptions) => Promise<{ text?: string }>;
  getScreenshot: (options?: PdfScreenshotOptions) => Promise<PdfScreenshotResult>;
};

type PdfParseModule = {
  default?: unknown;
  PDFParse?: PdfParseConstructor;
};

const require = createRequire(import.meta.url);

const OCR_TIMEOUT_MS = Number.parseInt(process.env.OCR_TIMEOUT_MS || '8000', 10);
const PDF_TIMEOUT_MS = Number.parseInt(process.env.PDF_TIMEOUT_MS || '20000', 10);
const PDF_OCR_PAGES = Number.parseInt(process.env.PDF_OCR_PAGES || '1', 10);
const PDF_OCR_SCALE = Number.parseFloat(process.env.PDF_OCR_SCALE || '1.25');
const INVOICE_KEYWORDS = [
  'invoice',
  'tax invoice',
  'gst',
  'vat',
  'bill to',
  'ship to',
  'invoice number',
  'invoice no',
  'invoice #',
  'subtotal',
  'total',
  'amount due',
  'grand total',
  'hsn',
];

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T | null> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`${label} timed out after ${timeoutMs}ms`);
          resolve(null);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getTesseractRecognize(mod: unknown): TesseractRecognize | null {
  const maybeDirect = mod as { recognize?: unknown };
  if (typeof maybeDirect.recognize === 'function') return maybeDirect.recognize as TesseractRecognize;

  const maybeDefault = mod as { default?: { recognize?: unknown } };
  if (typeof maybeDefault.default?.recognize === 'function') return maybeDefault.default.recognize as TesseractRecognize;

  return null;
}

export function isLikelyInvoiceText(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  let hits = 0;

  for (const keyword of INVOICE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }

  return false;
}

function getPdfParse(mod: unknown): PdfParseFn | null {
  if (typeof mod === 'function') return mod as PdfParseFn;

  const typed = mod as PdfParseModule;
  if (typeof typed.default === 'function') return typed.default as PdfParseFn;

  const PDFParse = typed.PDFParse;
  if (typeof PDFParse === 'function') {
    return async (buffer: Buffer) => {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return { text: result?.text ?? '' };
    };
  }

  return null;
}

export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tesseractMod = (await import('tesseract.js')) as unknown;
    const recognize = getTesseractRecognize(tesseractMod);
    if (!recognize) return '';

    const result = await withTimeout(
      recognize(buffer, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(message.progress * 100)}%`);
          }
        },
      }),
      OCR_TIMEOUT_MS,
      'Image OCR'
    );

    if (!result) return '';

    return result.data?.text ?? '';
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return '';
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfMod = require('pdf-parse') as PdfParseModule;
    const PDFParse = pdfMod.PDFParse;
    const pdfParse = getPdfParse(pdfMod);

    if (typeof PDFParse === 'function') {
      const parser = new PDFParse({ data: buffer });
      const data = await withTimeout(
        parser.getText({ itemJoiner: ' ', lineEnforce: false }),
        PDF_TIMEOUT_MS,
        'PDF text'
      );
      const text = data?.text ?? '';
      if (text.trim().length > 0) return text;

      const retry = new PDFParse({ data: buffer });
      const alt = await withTimeout(
        retry.getText({
          itemJoiner: ' ',
          lineEnforce: false,
          includeMarkedContent: true,
          disableNormalization: true,
        }),
        PDF_TIMEOUT_MS,
        'PDF text (fallback)'
      );
      const altText = alt?.text ?? '';
      if (altText.trim().length > 0) return altText;

      const ocrText = await extractTextFromPdfImages(buffer, PDFParse);
      return ocrText;
    }

    if (!pdfParse) return '';

    const data = await withTimeout(pdfParse(buffer), PDF_TIMEOUT_MS, 'PDF text');
    if (!data) return '';

    return data.text ?? '';
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return '';
  }
}

async function extractTextFromPdfImages(
  buffer: Buffer,
  PDFParse: PdfParseConstructor
): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const screenshots = await withTimeout(
      parser.getScreenshot({
        scale: Number.isFinite(PDF_OCR_SCALE) ? PDF_OCR_SCALE : 1.25,
        imageBuffer: true,
        imageDataUrl: false,
      }),
      PDF_TIMEOUT_MS,
      'PDF screenshot'
    );

    const pages = screenshots?.pages ?? [];
    if (!pages.length) return '';

    const tesseractMod = (await import('tesseract.js')) as unknown;
    const recognize = getTesseractRecognize(tesseractMod);
    if (!recognize) return '';

    const pageLimit = Math.max(1, Math.min(PDF_OCR_PAGES, pages.length));
    let combined = '';

    for (let i = 0; i < pageLimit; i += 1) {
      const page = pages[i];
      if (!page?.data) continue;

      const result = await withTimeout(
        recognize(Buffer.from(page.data), 'eng', {
          logger: (message) => {
            if (message.status === 'recognizing text') {
              console.log(`PDF OCR Progress: ${Math.round(message.progress * 100)}%`);
            }
          },
        }),
        OCR_TIMEOUT_MS,
        `PDF OCR page ${page.pageNumber ?? i + 1}`
      );

      if (result?.data?.text) {
        combined += `${result.data.text}\n`;
      }
    }

    return combined.trim();
  } catch (error) {
    console.error('PDF image OCR failed:', error);
    return '';
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractTextFromPdf(file);
  }

  if (
    fileType.startsWith('image/') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg')
  ) {
    return extractTextFromImage(file);
  }

  console.warn('Unsupported file type for OCR:', fileType);
  return '';
}

