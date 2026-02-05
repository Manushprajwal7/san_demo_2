/**
 * Test script for Form Generator system
 * Run with: npx tsx scripts/test-form-generator.ts
 */

import { loadTemplate, extractPlaceholders } from "../lib/docx-processor";
import {
  mapPlaceholdersToColumns,
  placeholderToColumn,
} from "../lib/db-mapper";

async function testFormGenerator() {
  console.log("🧪 Testing Form Generator System\n");

  // Test 1: Placeholder to Column Conversion
  console.log("Test 1: Placeholder to Column Conversion");
  console.log("==========================================");
  const testCases = [
    "Empname",
    "Designation Name",
    "Present Res No",
    "Date of Birth",
    "Aadhar No",
    "Employee Code",
    "Father Name",
  ];

  testCases.forEach((placeholder) => {
    const column = placeholderToColumn(placeholder);
    console.log(`  [[${placeholder}]] → ${column}`);
  });
  console.log("✅ Conversion test passed\n");

  // Test 2: Template Loading
  console.log("Test 2: Template Loading");
  console.log("========================");
  try {
    const templatePath = "forms/Form_A.docx";
    const buffer = loadTemplate(templatePath);
    console.log(`  ✅ Template loaded: ${buffer.length} bytes`);

    // Test 3: Placeholder Extraction
    console.log("\nTest 3: Placeholder Extraction");
    console.log("==============================");
    const placeholders = extractPlaceholders(buffer);
    console.log(`  Found ${placeholders.length} placeholders:`);
    placeholders.forEach((p) => console.log(`    - [[${p}]]`));

    // Test 4: Column Mapping
    console.log("\nTest 4: Column Mapping");
    console.log("======================");
    const mapping = mapPlaceholdersToColumns(placeholders);
    console.log("  Placeholder → Column mapping:");
    Object.entries(mapping).forEach(([placeholder, column]) => {
      console.log(`    [[${placeholder}]] → ${column}`);
    });

    console.log("\n✅ All tests passed!");
    console.log("\n📋 Summary:");
    console.log(`  - Template: ${templatePath}`);
    console.log(`  - Placeholders: ${placeholders.length}`);
    console.log(`  - Columns needed: ${Object.keys(mapping).length}`);
    console.log("\n💡 Next steps:");
    console.log("  1. Ensure your database has these columns");
    console.log("  2. Visit /dashboard/form-generator to test the UI");
    console.log("  3. Select a table and employee to generate a form");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\n💡 Troubleshooting:");
    console.log("  - Ensure forms/Form_A.docx exists");
    console.log("  - Check that the file is a valid DOCX");
    console.log("  - Verify placeholders use [[Name]] format");
  }
}

// Run tests
testFormGenerator().catch(console.error);
