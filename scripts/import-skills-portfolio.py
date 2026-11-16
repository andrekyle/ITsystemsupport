"""Extract content and blank record controls, never source styles/scripts or fictional results."""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = {'tag': 'root', 'attrs': {}, 'children': []}
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in ('input', 'br', 'img', 'meta', 'link', 'hr', 'wbr', 'source'):
            self.stack.append(node)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i]['tag'] == tag:
                self.stack = self.stack[:i]
                break
    def handle_data(self, data):
        self.stack[-1]['children'].append(data)

def text(node):
    if isinstance(node, str): return node
    return ''.join(text(c) for c in node['children'])

def descendants(node, tags):
    if isinstance(node, str): return []
    return ([node] if node['tag'] in tags else []) + [child for c in node['children'] for child in descendants(c, tags)]

keep = {1: [0,1], 2:[0], 4:[0,1,2], 5:[0,1,2], 35:[0], 37:[0,1], 39:[0], 40:[0], 41:[0], 42:[0], 47:[0], 48:[0], 49:[0]}
sections = []
parser = Parser()
parser.feed(Path(sys.argv[1]).read_text(encoding='utf-8'))
for section in descendants(parser.root, {'section'}):
    if 'data-section' not in section['attrs']: continue
    number = int(section['attrs']['data-section'])
    counter = [0]
    def nextid():
        counter[0] += 1
        return f's{number+1}-{counter[0]}'
    def convert(node):
        if isinstance(node, str): return []
        tag, attrs = node['tag'], node['attrs']
        value = re.sub(r'\s+', ' ', text(node)).strip().replace('\ufffd', '—')
        if tag in ('style','script','button','h2','svg','option') or attrs.get('class') in ('section-number','sample-notice','sample-evidence'): return []
        if tag == 'table':
            headers = [text(h).strip().replace('Completed learner information','Learner information').replace('Completed record','Record').replace('Completed control','Control').replace('Example mentor review','Mentor review') for h in descendants(node, {'th'})]
            rows = []
            for row in descendants(node, {'tr'}):
                cells = [c for c in row['children'] if isinstance(c,dict) and c['tag']=='td']
                if not cells: continue
                columns = keep.get(number, [])
                # Empty evidence indexes, assessment/workplace records, financial
                # transactions and cohort rows must never inherit fictional entries.
                if number in (44,45): columns = [0] if headers[0] in ('Training category','Selected payslip') else []
                if number == 49 and headers[0] == 'Learner': columns = []
                rows.append([{'id': nextid(), 'text': re.sub(r'\s+', ' ', text(cell)).strip() if ci in columns else '', 'fixed': ci in columns} for ci,cell in enumerate(cells)])
            return [{'kind':'table','id':nextid(),'headers':headers,'rows':rows}]
        controls = descendants(node, {'input','textarea','select'})
        if tag == 'label' and controls:
            control = controls[0]
            return [field(control, re.sub(r'\s+', ' ', ''.join(text(c) for c in node['children'] if c is not control)).strip())]
        if tag in ('input','textarea','select'): return [field(node, attrs.get('aria-label') or 'Response')]
        if tag in ('p','h3','h4','li'):
            if not value or re.search(r'Thabo|Mokoena|Naledi Dlamini|Priya Naidoo|Ayesha Patel|Daniel Jacobs|fictional|Portfolio status:|Version 1\.0 \| Prepared|Verification close out:', value, re.I): return []
            if value.startswith('Final achievement record:'): value = 'Final achievement record: record actual assessment and recognition decisions, achieved credits and certification references below.'
            if value.startswith('Twelve month payroll summary'): value = 'Retain the twelve-month payroll summary for the actual measured period.'
            if value.startswith('First month payment:'): value = 'Match first and last month EMP201 payments to the measured-period returns and source payment confirmations. Retain the company-wide tax evidence with the authorised custodian.'
            # Portfolio examples remain prompts, never claims of learner achievement.
            return [{'kind':'text','id':nextid(),'level':tag,'text':value}]
        return [block for child in node['children'] for block in convert(child)]
    def field(node, label):
        attrs = node['attrs']
        kind = 'checkbox' if attrs.get('type') == 'checkbox' else 'select' if node['tag']=='select' else 'textarea' if node['tag']=='textarea' else 'text'
        options = [{'value':o['attrs'].get('value',text(o)), 'label':text(o).strip()} for o in descendants(node, {'option'})]
        return {'kind':'field','id':attrs.get('data-field',nextid()),'label':label or 'Response','type':kind, **({'options':options} if options else {})}
    title = text(descendants(section, {'h2'})[0]).strip()
    blocks = convert(section)
    sections.append({'id':f'section-{number+1}','title':title,'blocks':blocks})
assert len(sections) == 50
Path('src/data/skillsPortfolio.json').write_text(json.dumps(sections, ensure_ascii=False, separators=(',',':')),encoding='utf-8')
print(f'Imported {len(sections)} content sections with blank learner records; no styles, scripts or sample results.')
