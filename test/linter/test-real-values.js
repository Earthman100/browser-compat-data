'use strict';
const path = require('path');
const chalk = require('chalk');
const { Logger } = require('./utils.js');

/**
 * @typedef {import('../../types').Identifier} Identifier
 * @typedef {import('../../types').SimpleSupportStatement} SimpleSupportStatement
 * @typedef {import('../../types').SupportBlock} SupportBlock
 * @typedef {import('../../types').VersionValue} VersionValue
 */

/** @type {string[]} */
const blockMany = [
  'chrome',
  'chrome_android',
  'edge',
  'firefox',
  'firefox_android',
  'ie',
  'opera',
  'opera_android',
  'safari',
  'safari_ios',
  'samsunginternet_android',
  'webview_android',
];

/** @type {Record<string, string[]>} */
const blockList = {
  api: [
    'chrome',
    'chrome_android',
    'edge',
    'firefox',
    'ie',
    'safari',
    'safari_ios',
    'webview_android',
  ],
  css: blockMany,
  html: [],
  http: [],
  svg: [],
  javascript: [...blockMany, 'nodejs'],
  mathml: blockMany,
  webdriver: blockMany,
  webextensions: [],
};

/**
 * @param {SupportBlock} supportData
 * @param {string[]} blockList
 * @param {string} relPath
 * @param {Logger} logger
 */
function checkRealValues(supportData, blockList, relPath, logger) {
  for (const browser of blockList) {
    /** @type {SimpleSupportStatement[]} */
    const supportStatements = [];
    if (Array.isArray(supportData[browser])) {
      Array.prototype.push.apply(supportStatements, supportData[browser]);
    } else {
      supportStatements.push(supportData[browser]);
    }

    for (const statement of supportStatements) {
      if (statement === undefined) {
        logger.error(
          chalk`{red → {bold ${browser}} must be defined for {bold ${relPath}}}`,
        );
      } else {
        if ([true, null].includes(statement.version_added)) {
          logger.error(
            chalk`{red → {bold ${relPath}} - {bold ${browser}} no longer accepts {bold ${statement.version_added}} as a value}`,
          );
        }
        if ([true, null].includes(statement.version_removed)) {
          logger.error(
            chalk`{red → {bold ${relPath}} - {bold ${browser}} no longer accepts} {bold ${statement.version_removed}} as a value}`,
          );
        }
      }
    }
  }
}

/**
 * @param {string} filename
 */
function testRealValues(filename) {
  const relativePath = path.relative(
    path.resolve(__dirname, '..', '..'),
    filename,
  );
  const category =
    relativePath.includes(path.sep) && relativePath.split(path.sep)[0];
  /** @type {Identifier} */
  const data = require(filename);
  const logger = new Logger('Real values');

  /**
   * @param {Identifier} data
   * @param {string} [relPath]
   */
  function findSupport(data, relPath) {
    for (const prop in data) {
      if (prop === '__compat' && data[prop].support) {
        if (blockList[category] && blockList[category].length > 0)
          checkRealValues(
            data[prop].support,
            blockList[category],
            relPath,
            logger,
          );
      }
      const sub = data[prop];
      if (typeof sub === 'object') {
        findSupport(sub, relPath ? `${relPath}.${prop}` : `${prop}`);
      }
    }
  }
  findSupport(data);

  logger.emit();
  return logger.hasErrors();
}

module.exports = testRealValues;
