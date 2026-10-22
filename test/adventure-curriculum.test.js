import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGradeQuestions, CAMPAIGN_DETAILS, createCampaignContent } from '../lib/adventure-campaigns.js';
import { createCampaignStages, evaluateStage } from '../lib/adventure.js';
import { GRADE_PROFILES } from '../lib/questions.js';

test('each grade encounters every available curriculum topic during the 100-floor tower', () => {
  for (const profile of GRADE_PROFILES) {
    const stages = createCampaignContent('tower', profile.grade);
    const choices = stages.filter(stage => stage.kind === 'choice');
    assert.equal(stages.length, 100);
    assert.deepEqual(new Set(choices.map(stage => stage.topic)), new Set(profile.topics));
    for (const [index, stage] of stages.entries()) {
      assert.equal(stage.floor, index + 1);
      assert.equal(stage.zone, Math.floor(index / 10) + 1);
      assert.equal(stage.boss, (index + 1) % 10 === 0);
    }
  }
});

test('grade-based campaign choices have a single correct answer and stable bilingual values', () => {
  for (let grade = 1; grade <= 6; grade++) {
    for (const { id: campaign, version } of CAMPAIGN_DETAILS) {
      const thai = createCampaignStages(campaign, grade, 'th');
      const english = createCampaignStages(campaign, grade, 'en');
      const again = createCampaignStages(campaign, grade, 'th');
      assert.deepEqual(thai, again, `${campaign} grade ${grade} must remain deterministic`);
      assert.equal(version, `${campaign}-v1`);
      for (const stage of thai.filter(stage => stage.kind === 'choice')) {
        const translated = english.find(item => item.id === stage.id);
        assert.equal(translated.questionId, stage.questionId);
        assert.equal(translated.topic, stage.topic);
        assert.equal(translated.correctId, stage.correctId);
        assert.deepEqual(translated.options, stage.options);
        assert.equal(new Set(stage.options.map(option => option.value)).size, stage.options.length);
        assert.ok(stage.options.every(option => Number.isFinite(option.value)));
        for (const option of stage.options) {
          assert.deepEqual(evaluateStage(stage, [option.id]), { valid: true, correct: option.id === stage.correctId });
        }
      }
    }
  }
});

test('forest keeps its checkpoint and option IDs while using the chosen grade', () => {
  for (let grade = 1; grade <= 6; grade++) {
    const stages = createCampaignStages('forest', grade);
    assert.deepEqual(stages.map(stage => stage.id), ['forest-pattern', 'forest-bridge', 'forest-path', 'forest-camp', 'forest-guardian']);
    assert.deepEqual(stages.map(stage => stage.kind), ['choice', 'sum', 'choice', 'choice', 'route']);
    assert.deepEqual(stages.filter(stage => stage.kind === 'choice').map(stage => stage.correctId), ['pattern-1', 'path-0', 'camp-2']);
    assert.deepEqual(stages.filter(stage => stage.kind === 'choice').map(stage => stage.topic), GRADE_PROFILES[grade - 1].topics.slice(0, 3));
    assert.equal(stages[1].target, 6 * [1, 2, 10, 25, 0.5, 1.25][grade - 1]);
    assert.equal(evaluateStage(stages[4], ['A', 'B', 'C']).correct, true);
  }
});

test('integration keeps narrative IDs and all non-choice gameplay intact', () => {
  const stages = [
    { id: 'gate', title: 'ประตูถ้ำ', kind: 'choice', prompt: 'old prompt', hint: 'old hint', options: [{ id: 'left' }, { id: 'middle' }, { id: 'right' }], correctId: 'right' },
    { id: 'bridge', title: 'สะพาน', kind: 'sum', target: 7, options: [{ id: 'a', value: 3 }, { id: 'b', value: 4 }] },
  ];
  const grade = 6, offset = GRADE_PROFILES[grade - 1].topics.length - 1;
  const integrated = applyGradeQuestions(stages, grade, 'th', offset);
  assert.equal(integrated[0].id, stages[0].id);
  assert.equal(integrated[0].title, stages[0].title);
  assert.equal(integrated[0].correctId, 'right');
  assert.deepEqual(integrated[0].options.map(option => option.id), ['left', 'middle', 'right']);
  assert.equal(integrated[0].topic, GRADE_PROFILES[grade - 1].topics[offset]);
  assert.equal(integrated[1], stages[1]);
  assert.equal(stages[0].prompt, 'old prompt');
});

test('adventure data visuals retain numeric evidence and translate labels when language changes', () => {
  const covered = new Set();
  const evidence = visual => ({ type: visual.type, values: visual.values, scale: visual.scale, symbol: visual.symbol, rows: visual.rows });
  for (let grade = 1; grade <= 6; grade++) {
    const thai = createCampaignContent('tower', grade, 'th');
    const english = createCampaignContent('tower', grade, 'en');
    for (const stage of thai.filter(item => ['bar', 'table', 'pictograph'].includes(item.visual?.type))) {
      const translated = english.find(item => item.id === stage.id);
      covered.add(stage.visual.type);
      assert.equal(stage.questionId, translated.questionId);
      assert.deepEqual(evidence(stage.visual), evidence(translated.visual));
      assert.notDeepEqual(stage.visual.labels, translated.visual.labels);
      assert.doesNotMatch([translated.visual.unit, ...translated.visual.labels, ...(translated.visual.columns ?? [])].join(' '), /[\u0E00-\u0E7F]/);
      assert.equal(stage.visual.labels.length, translated.visual.labels.length);
      assert.equal(stage.correctId, translated.correctId);
      assert.deepEqual(stage.options, translated.options);
      if (stage.visual.columns) assert.notDeepEqual(stage.visual.columns, translated.visual.columns);
    }
  }
  assert.deepEqual(covered, new Set(['pictograph', 'table', 'bar']));
});
