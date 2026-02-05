/**
 * Test script for DOCX form generation
 * Run with: npx tsx scripts/test-docx-generation.ts
 */

import {
  loadTemplate,
  extractPlaceholders,
  populateTemplate,
  validateTemplate,
} from "../lib/docx-processor";
import {
  mapPlaceholdersToColumns,
  transformDataForTemplate,
} from "../lib/db-mapper";
import { writeFileSync } from "fs";
import { join } from "path";

async function testDocxGeneration() {
  console.log("🧪 Testing DOCX Form Generation\n");

  try {
    // Step 1: Load template
    console.log("1️⃣ Loading template...");
    const templatePath = "forms/Form_A.docx";
    const templateBuffer = loadTemplate(templatePath);
    console.log("✅ Template loaded successfully\n");

    // Step 2: Validate template
    console.log("2️⃣ Validating template...");
    const validation = validateTemplate(templateBuffer);
    console.log(`   Valid: ${validation.valid}`);
    console.log(`   Placeholders found: ${validation.placeholders.length}`);
    if (validation.errors.length > 0) {
      console.log(`   ❌ Errors: ${validation.errors.join(", ")}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${validation.warnings.join(", ")}`);
    }
    console.log();

    // Step 3: Extract placeholders
    console.log("3️⃣ Extracting placeholders...");
    const placeholders = extractPlaceholders(templateBuffer);
    console.log(`   Found ${placeholders.length} placeholders:`);
    placeholders.forEach((p, i) => {
      console.log(`   ${i + 1}. [[${p}]]`);
    });
    console.log();

    // Step 4: Map to database columns
    console.log("4️⃣ Mapping placeholders to database columns...");
    const columnMapping = mapPlaceholdersToColumns(placeholders);
    console.log("   Mapping:");
    Object.entries(columnMapping).forEach(([placeholder, column]) => {
      console.log(`   [[${placeholder}]] → ${column}`);
    });
    console.log();

    // Step 5: Create sample data
    console.log("5️⃣ Creating sample employee data...");
    const sampleData: Record<string, any> = {
      empname: "John Doe",
      designation_name: "Senior Software Engineer",
      present_res_no: "123 Main Street, Apartment 4B",
      date_of_birth: "1990-05-15",
      aadhar_no: "1234-5678-9012",
      pan_no: "ABCDE1234F",
      uan_no: "123456789012",
      esic_no: "1234567890123456",
      bank_name: "State Bank of India",
      bank_account_no: "12345678901234",
      ifsc_code: "SBIN0001234",
      mobile_no: "9876543210",
      email: "john.doe@example.com",
      father_name: "Robert Doe",
      mother_name: "Mary Doe",
      marital_status: "Married",
      spouse_name: "Jane Doe",
      emergency_contact: "9876543211",
      blood_group: "O+",
      qualification: "B.Tech Computer Science",
      experience_years: "8",
      joining_date: "2020-01-15",
      department: "Engineering",
      reporting_manager: "Alice Smith",
      work_location: "Bangalore Office",
      employee_type: "Permanent",
      salary: "1200000",
      pf_number: "KA/BLR/12345/67890",
    };
    console.log(
      `   Created sample data with ${Object.keys(sampleData).length} fields\n`,
    );

    // Step 6: Transform data for template
    console.log("6️⃣ Transforming data for template...");
    const templateData = transformDataForTemplate(sampleData, columnMapping);
    console.log("   Template data:");
    Object.entries(templateData).forEach(([key, value]) => {
      const status = value ? "✅" : "❌";
      console.log(`   ${status} [[${key}]] = "${value}"`);
    });
    console.log();

    // Step 7: Populate template
    console.log("7️⃣ Populating template...");
    const populatedBuffer = populateTemplate(templateBuffer, templateData);
    console.log(
      `   Generated document size: ${populatedBuffer.length} bytes\n`,
    );

    // Step 8: Save output
    console.log("8️⃣ Saving output...");
    const outputPath = join(process.cwd(), "forms", "Form_A_TEST_OUTPUT.docx");
    writeFileSync(outputPath, populatedBuffer);
    console.log(`   ✅ Saved to: ${outputPath}\n`);

    // Summary
    console.log("📊 Summary:");
    console.log(`   Total placeholders: ${placeholders.length}`);
    console.log(
      `   Filled fields: ${Object.values(templateData).filter((v) => v).length}`,
    );
    console.log(
      `   Empty fields: ${Object.values(templateData).filter((v) => !v).length}`,
    );
    console.log(
      `   Success rate: ${Math.round((Object.values(templateData).filter((v) => v).length / placeholders.length) * 100)}%`,
    );
    console.log();

    console.log("✅ Test completed successfully!");
    console.log(`\n📄 Open the generated file to verify: ${outputPath}`);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error("   Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testDocxGeneration();
