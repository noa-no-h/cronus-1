import { expect } from 'bun:test';
import { CategorizationResult } from './categorizationService';

export function assertCategorization({
  testName,
  result,
  allCategories,
  expectedCategoryName,
}: {
  testName: string;
  result: CategorizationResult;
  allCategories: any[];
  expectedCategoryName: string;
}) {
  const receivedCategory = allCategories.find((c) => c._id === result.categoryId);
  const expectedCategory = allCategories.find((c) => c.name === expectedCategoryName);

  console.log(`${testName} - Category Name:`, receivedCategory?.name);
  console.log(`${testName} - LLM Summary:`, result.llmSummary);
  console.log(`${testName} - Category Reasoning:`, result.categoryReasoning);

  expect(receivedCategory?.name ?? 'Category Not Found').toBe(
    expectedCategory?.name ?? 'Expected Category Not Found'
  );
}
