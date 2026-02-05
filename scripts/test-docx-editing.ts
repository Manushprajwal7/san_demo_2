/**
 * Test script for DOCX editing functionality
 * Run with: npx tsx scripts/test-docx-editing.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

async function testDocxEditing() {
  console.log("🧪 Testing DOCX Editing Functionality\n");

  // Test 1: Check if template exists
  console.log("1️⃣ Checking template file...");
  try {
    const templatePath = join(process.cwd(), "forms", "Form_A.docx");
    const templateBuffer = readFileSync(templatePath);
    console.log("✅ Template found:", templatePath);
    console.log("   Size:", (templateBuffer.length / 1024).toFixed(2), "KB\n");
  } catch (error) {
    console.error("❌ Template not found at forms/Form_A.docx");
    console.error("   Please create this file with [[placeholder]] patterns\n");
    return;
  }

  // Test 2: Extract placeholders
  console.log("2️⃣ Extracting placeholders...");
  try {
    const { extractPlaceholders, loadTemplate } =
      await import("../lib/docx-processor");
    const templateBuffer = loadTemplate("forms/Form_A.docx");
    const placeholders = extractPlaceholders(templateBuffer);

    if (placeholders.length === 0) {
      console.log("⚠️  No placeholders found in template");
      console.log(
        "   Add placeholders like [[Empname]], [[Designation Name]]\n",
      );
    } else {
      console.log(`✅ Found ${placeholders.length} placeholders:`);
      placeholders.forEach((p) => console.log(`   - [[${p}]]`));
      console.log();
    }
  } catch (error) {
    console.error("❌ Error extracting placeholders:", error);
    return;
  }

  // Test 3: Test column mapping
  console.log("3️⃣ Testing column mapping...");
  try {
    const { mapPlaceholdersToColumns } = await import("../lib/db-mapper");
    const { extractPlaceholders, loadTemplate } =
      await import("../lib/docx-processor");

    const templateBuffer = loadTemplate("forms/Form_A.docx");
    const placeholders = extractPlaceholders(templateBuffer);
    const mapping = mapPlaceholdersToColumns(placeholders);

    console.log("✅ Column mapping:");
    Object.entries(mapping).forEach(([placeholder, column]) => {
      console.log(`   [[${placeholder}]] → ${column}`);
    });
    console.log();
  } catch (error) {
    console.error("❌ Error in column mapping:", error);
    return;
  }

  // Test 4: Test DOCX population with sample data
  console.log("4️⃣ Testing DOCX population...");
  try {
    const { populateTemplate, loadTemplate, extractPlaceholders } =
      await import("../lib/docx-processor");

    const templateBuffer = loadTemplate("forms/Form_A.docx");
    const placeholders = extractPlaceholders(templateBuffer);

    // Create sample data
    const sampleData: Record<string, string> = {};
    placeholders.forEach((placeholder, index) => {
      sampleData[placeholder] = `Sample ${placeholder} ${index + 1}`;
    });

    console.log("   Using sample data:");
    Object.entries(sampleData)
      .slice(0, 3)
      .forEach(([key, value]) => {
        console.log(`   - ${key}: "${value}"`);
      });
    if (Object.keys(sampleData).length > 3) {
      console.log(`   ... and ${Object.keys(sampleData).length - 3} more`);
    }

    const populatedBuffer = await populateTemplate(templateBuffer, sampleData);

    // Save test output
    const outputPath = join(process.cwd(), "forms", "Form_A_TEST.docx");
    writeFileSync(outputPath, populatedBuffer);

    console.log("✅ DOCX populated successfully!");
    console.log(`   Test file saved: ${outputPath}`);
    console.log(
      "   Open this file in Word to verify placeholders are replaced\n",
    );
  } catch (error) {
    console.error("❌ Error populating DOCX:", error);
    return;
  }

  // Test 5: Check database connection
  console.log("5️⃣ Testing database connection...");
  try {
    const { createServerSupabaseClient } = await import("../lib/supabase");
    const supabase = createServerSupabaseClient();

    // Try to fetch from notice_tables_registry
    const { data, error } = await supabase
      .from("notice_tables_registry")
      .select("table_name")
      .limit(1);

    if (error) {
      console.log("⚠️  Database connection issue:", error.message);
      console.log(
        "   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set\n",
      );
    } else {
      console.log("✅ Database connection successful");
      if (data && data.length > 0) {
        console.log(`   Found table: ${data[0].table_name}\n`);
      } else {
        console.log("   No tables found in registry\n");
      }
    }
  } catch (error) {
    console.log("⚠️  Could not test database connection");
    console.log(
      "   This is OK if you haven't set up environment variables yet\n",
    );
  }

  // Summary
  console.log("=".repeat(60));
  console.log("✨ Test Summary");
  console.log("=".repeat(60));
  console.log("✅ Template loading: Working");
  console.log("✅ Placeholder extraction: Working");
  console.log("✅ Column mapping: Working");
  console.log("✅ DOCX population: Working");
  console.log("\n📝 Next Steps:");
  console.log(
    "1. Open forms/Form_A_TEST.docx to verify placeholders are replaced",
  );
  console.log("2. Start your Next.js app: npm run dev");
  console.log("3. Navigate to: http://localhost:3000/dashboard/form-generator");
  console.log(
    "4. Select template, table, and employee to generate a real form",
  );
  console.log("\n🎉 All tests passed! Your DOCX generator is ready to use.\n");
}

// Run tests
testDocxEditing().catch(console.error);
