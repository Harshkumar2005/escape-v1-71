
import { CSSProperties } from 'react';

// Custom dark theme inspired by various popular dark themes
export const customDarkTheme: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': {
    color: '#ABB2BF',
    background: 'none',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#ABB2BF',
    background: '#282C34',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
    borderRadius: '0.3em',
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#282C34',
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal',
  },
  comment: {
    color: '#6A737D',
    fontStyle: 'italic',
  },
  prolog: {
    color: '#6A737D',
  },
  doctype: {
    color: '#6A737D',
  },
  cdata: {
    color: '#6A737D',
  },
  punctuation: {
    color: '#ABB2BF',
  },
  property: {
    color: '#E06C75',
  },
  tag: {
    color: '#E06C75',
  },
  boolean: {
    color: '#D19A66',
  },
  number: {
    color: '#D19A66',
  },
  constant: {
    color: '#D19A66',
  },
  symbol: {
    color: '#98C379',
  },
  selector: {
    color: '#E06C75',
  },
  'attr-name': {
    color: '#D19A66',
  },
  string: {
    color: '#98C379',
  },
  char: {
    color: '#98C379',
  },
  builtin: {
    color: '#E5C07B',
  },
  operator: {
    color: '#56B6C2',
  },
  entity: {
    color: '#E5C07B',
    cursor: 'help',
  },
  url: {
    color: '#56B6C2',
  },
  '.language-css .token.string': {
    color: '#56B6C2',
  },
  '.style .token.string': {
    color: '#56B6C2',
  },
  variable: {
    color: '#E06C75',
  },
  inserted: {
    color: '#98C379',
  },
  atrule: {
    color: '#C678DD',
  },
  'attr-value': {
    color: '#98C379',
  },
  keyword: {
    color: '#C678DD',
  },
  regex: {
    color: '#56B6C2',
  },
  important: {
    color: '#C678DD',
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  deleted: {
    color: '#E06C75',
  },
  'class-name': {
    color: '#E5C07B',
  },
  function: {
    color: '#61AFEF',
  },
};

// Custom light theme inspired by GitHub light
export const customLightTheme: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': {
    color: '#24292e',
    background: 'none',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#24292e',
    background: '#f6f8fa',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
    borderRadius: '0.3em',
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#f6f8fa',
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal',
  },
  comment: {
    color: '#6A737D',
    fontStyle: 'italic',
  },
  prolog: {
    color: '#6A737D',
  },
  doctype: {
    color: '#6A737D',
  },
  cdata: {
    color: '#6A737D',
  },
  punctuation: {
    color: '#24292e',
  },
  property: {
    color: '#E06C75',
  },
  tag: {
    color: '#22863a',
  },
  boolean: {
    color: '#D19A66',
  },
  number: {
    color: '#D19A66',
  },
  constant: {
    color: '#D19A66',
  },
  symbol: {
    color: '#98C379',
  },
  selector: {
    color: '#E06C75',
  },
  'attr-name': {
    color: '#D19A66',
  },
  string: {
    color: '#98C379',
  },
  char: {
    color: '#98C379',
  },
  builtin: {
    color: '#E5C07B',
  },
  operator: {
    color: '#56B6C2',
  },
  entity: {
    color: '#E5C07B',
    cursor: 'help',
  },
  url: {
    color: '#56B6C2',
  },
  '.language-css .token.string': {
    color: '#56B6C2',
  },
  '.style .token.string': {
    color: '#56B6C2',
  },
  variable: {
    color: '#E06C75',
  },
  inserted: {
    color: '#98C379',
  },
  atrule: {
    color: '#C678DD',
  },
  'attr-value': {
    color: '#98C379',
  },
  keyword: {
    color: '#C678DD',
  },
  regex: {
    color: '#56B6C2',
  },
  important: {
    color: '#C678DD',
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  deleted: {
    color: '#E06C75',
  },
  'class-name': {
    color: '#E5C07B',
  },
  function: {
    color: '#61AFEF',
  },
};
