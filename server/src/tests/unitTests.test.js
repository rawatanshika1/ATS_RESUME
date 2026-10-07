const assert = require('assert');
const { clampScore, sanitizeAnalysisResult, safeJsonParse } = require('../utils/scoreUtils');
const { parsePdfBuffer } = require('../services/pdfService');
const { checkParseability } = require('../utils/parseabilityUtils');

async function runUnitTests() {
  console.log('🧪 RUNNING UNIT TESTS FOR PDF SERVICE & SCORE CLAMPING...');

  // Test 1: clampScore limits
  assert.strictEqual(clampScore(120), 100, 'Score > 100 should clamp to 100');
  assert.strictEqual(clampScore(-15), 0, 'Score < 0 should clamp to 0');
  assert.strictEqual(clampScore(84.7), 85, 'Score should round to integer');
  assert.strictEqual(clampScore(null, 50), 50, 'Null score should return fallback');
  console.log('✅ 1. clampScore tests passed.');

  // Test 2: sanitizeAnalysisResult
  const mockRawGeminiOutput = {
    overallScore: 105,
    breakdown: {
      keywordMatch: 88,
      skillsMatch: -10,
      experienceRelevance: 75,
      formatting: 90,
      education: 80
    },
    matchedKeywords: ['React', 'Node.js'],
    missingKeywords: [{ keyword: 'Docker', importance: 'HIGH', whereToAdd: 'Skills' }],
    strengths: ['Strong fullstack experience'],
    suggestions: [{ section: 'Projects', issue: 'Missing metrics', improvement: 'Add metrics', exampleRewrite: 'Increased speed by 40%' }],
    summary: 'Great resume overall.'
  };

  const sanitized = sanitizeAnalysisResult(mockRawGeminiOutput);
  assert.strictEqual(sanitized.overallScore, 100, 'Overall score should clamp to 100');
  assert.strictEqual(sanitized.breakdown.skillsMatch, 0, 'Skills match -10 should clamp to 0');
  assert.strictEqual(sanitized.missingKeywords[0].importance, 'high', 'Importance should normalize to lowercase');
  console.log('✅ 2. sanitizeAnalysisResult tests passed.');

  // Test 3: safeJsonParse
  const jsonWithMarkdown = '```json\n{"overallScore": 85}\n```';
  const parsed = safeJsonParse(jsonWithMarkdown);
  assert.strictEqual(parsed.overallScore, 85, 'Safe JSON parse should handle markdown codeblocks');
  assert.throws(() => safeJsonParse('{not valid JSON'), SyntaxError, 'Malformed JSON must not be accepted as valid data');
  console.log('✅ 3. safeJsonParse tests passed.');

  // Test 4: ATS parseability checklist uses stable, transparent status values
  const checklistResume = [
    'SUMMARY',
    `Reliable engineer ${Array(175).fill('capable').join(' ')}`,
    'EXPERIENCE',
    'alex@example.com | +1 555 123 4567',
    '- Built a service and increased throughput by 20%.',
    '- Improved delivery time for 120 users.',
    'EDUCATION',
    '2019-2022'
  ].join('\n');
  const checklist = checkParseability(checklistResume);
  assert.strictEqual(checklist.length, 8, 'Checklist should cover all eight ATS parseability criteria');
  assert.ok(checklist.every((check) => ['pass', 'warn', 'fail'].includes(check.status)));
  assert.strictEqual(checklist.find((check) => check.id === 'contact').status, 'pass');
  assert.strictEqual(checklist.find((check) => check.id === 'metrics').status, 'pass');
  assert.strictEqual(checklist.find((check) => check.id === 'action-verbs').status, 'pass');
  const emptyChecklist = checkParseability('');
  assert.strictEqual(emptyChecklist.find((check) => check.id === 'headings').status, 'fail');
  console.log('✅ 4. ATS parseability checklist tests passed.');

  // Test 5: PDF Service invalid/scanned rejection
  try {
    // Create an empty / minimal buffer with no readable text
    const emptyBuffer = Buffer.from('%PDF-1.4 empty pdf text buffer');
    await parsePdfBuffer(emptyBuffer);
    assert.fail('Should have thrown an error for empty/unparseable PDF');
  } catch (err) {
    assert.ok(err.message.includes('No readable text found'), 'Should reject scanned/empty PDF with exact expected error message');
    console.log('✅ 5. PDF Service rejection test passed.');
  }

  console.log('🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
}

runUnitTests().catch((err) => {
  console.error('❌ UNIT TEST FAILED:', err);
  process.exit(1);
});
