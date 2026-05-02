import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, screen } from '@testing-library/react';
import puppeteer, { Browser, Page } from 'puppeteer';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Index test', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'puppeteer-'));
    browser = await puppeteer.launch({ userDataDir });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  const getElements = () => ({
    countButton: screen.getByTestId('count-button'),
  });

  test('increment count', async () => {
    await page.goto('http://localhost:5173/');

    const { countButton } = getElements();

    fireEvent.click(countButton);

    expect(await screen.findByText('Count is 1')).toBeInTheDocument();
  });
});
