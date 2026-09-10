import { Form, FormVersion, Question } from '../shared/types';

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
};

function escapeXml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => XML_ESCAPES[character]);
}

function xpathFor(name: string): string {
  return `/data/${name}`;
}

function expressionFor(expression: string): string {
  return expression.replace(/\$\{([^}]+)\}/g, '/data/$1');
}

function xformType(question: Question): string {
  switch (question.type) {
    case 'integer':
      return 'int';
    case 'decimal':
      return 'decimal';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
      return 'dateTime';
    case 'geopoint':
      return 'geopoint';
    case 'image':
      return 'binary';
    case 'audio':
      return 'binary';
    case 'select_one':
    case 'yes_no':
    case 'dropdown':
      return 'select1';
    case 'select_multiple':
      return 'select';
    default:
      return 'string';
  }
}

function choiceBody(question: Question): string {
  return (question.choices || [])
    .map(choice =>
      `<item><label ref="jr:itext('jr_${escapeXml(question.name)}_${escapeXml(choice.value)}')"/><value>${escapeXml(choice.value)}</value></item>`
    )
    .join('');
}

function itextEntries(question: Question): string {
  const entries = [
    `<text id="jr_${escapeXml(question.name)}"><value>${escapeXml(question.label)}</value></text>`
  ];
  for (const choice of question.choices || []) {
    entries.push(
      `<text id="jr_${escapeXml(question.name)}_${escapeXml(choice.value)}"><value>${escapeXml(choice.label)}</value></text>`
    );
  }
  return entries.join('');
}

function bindFor(question: Question): string {
  const attributes = [
    `nodeset="${escapeXml(xpathFor(question.name))}"`,
    `type="${xformType(question)}"`
  ];
  if (question.required) attributes.push('required="true()"');
  if (question.readOnly) attributes.push('readonly="true()"');
  if (question.relevant) {
    attributes.push(`relevant="${escapeXml(expressionFor(question.relevant))}"`);
  }
  if (question.constraint) {
    attributes.push(`constraint="${escapeXml(expressionFor(question.constraint))}"`);
  }
  if (question.constraintMessage) {
    attributes.push(`jr:constraintMsg="${escapeXml(question.constraintMessage)}"`);
  }
  if (question.calculation) {
    attributes.push(`calculate="${escapeXml(expressionFor(question.calculation))}"`);
  }
  return `<bind ${attributes.join(' ')}/>`;
}

function instanceFor(questions: Question[]): string {
  const output: string[] = [];
  for (const question of questions.slice().sort((a, b) => a.order - b.order)) {
    if (question.type === 'begin_group' || question.type === 'begin_repeat') {
      output.push(`<${escapeXml(question.name)}>`);
    } else if (question.type === 'end_group' || question.type === 'end_repeat') {
      const openingName = question.groupId || question.repeatId;
      if (openingName) output.push(`</${escapeXml(openingName)}>`);
    } else if (question.type !== 'note') {
      const value = question.defaultValue === undefined || question.defaultValue === null
        ? ''
        : escapeXml(question.defaultValue);
      output.push(`<${escapeXml(question.name)}>${value}</${escapeXml(question.name)}>`);
    }
  }
  return output.join('');
}

function bodyFor(question: Question): string {
  const label = `jr:itext('jr_${escapeXml(question.name)}')`;
  const hint = question.hint ? `<hint>${escapeXml(question.hint)}</hint>` : '';
  switch (question.type) {
    case 'begin_group':
      return `<group ref="${escapeXml(xpathFor(question.name))}"><label>${label}</label>`;
    case 'end_group':
      return '</group>';
    case 'begin_repeat':
      return `<repeat nodeset="${escapeXml(xpathFor(question.name))}"><label>${label}</label>`;
    case 'end_repeat':
      return '</repeat>';
    case 'note':
      return `<label>${label}</label>`;
    case 'select_one':
    case 'yes_no':
    case 'dropdown':
      return `<select1 ref="${escapeXml(xpathFor(question.name))}"><label>${label}</label>${hint}${choiceBody(question)}</select1>`;
    case 'select_multiple':
      return `<select ref="${escapeXml(xpathFor(question.name))}"><label>${label}</label>${hint}${choiceBody(question)}</select>`;
    default:
      return `<input ref="${escapeXml(xpathFor(question.name))}"><label>${label}</label>${hint}</input>`;
  }
}

export function buildOdkXform(form: Form, version?: FormVersion): string {
  const questions = version?.questions || form.questions;
  const formId = form.settings.formId || form.id;
  const versionId = version?.id || form.currentVersionId || `${form.id}_draft`;
  const body = questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(bodyFor)
    .join('');
  const binds = questions
    .filter(question => !['begin_group', 'end_group', 'begin_repeat', 'end_repeat', 'note'].includes(question.type))
    .map(bindFor)
    .join('');
  const itext = questions.map(itextEntries).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <h:head>
    <h:title>${escapeXml(form.title)}</h:title>
    <model>
      <instance>
        <data id="${escapeXml(formId)}" version="${escapeXml(String(version?.versionNumber || form.currentVersion || 0))}" cmrg_form_id="${escapeXml(form.id)}" cmrg_version_id="${escapeXml(versionId)}">${instanceFor(questions)}</data>
      </instance>
      <itext><translation lang="${escapeXml(form.settings.defaultLanguage || 'English')}">${itext}</translation></itext>
      <bind nodeset="/data" type="string"/>
      ${binds}
    </model>
  </h:head>
  <h:body>${body}</h:body>
</h:html>`;
}
