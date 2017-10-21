''' author: samtenka
    changed: 2017-10-09
    created: 2017-09-29
    description: generation HTML table given CSV file
    usage: python gen_table.py events.csv events.html
'''

import sys

def rows_from_csv(csvnm, delimiter=';', line_delimiter='@'):
    with open(csvnm) as f:
        lines = f.read().split(line_delimiter) 
    return [[w.strip() for w in l.split(delimiter)] for l in lines if l.strip()]

def linkify(element):
    if '|' not in element:
        return element 
    lines = filter(None, element.split('|'))
    def link(line):  
        line = line.strip()
        if line.startswith('$'):
            tokens = filter(None, line[1:].split(' '))
            text = ' '.join(tokens[:-1])
            url = tokens[-1] 
            return '<a href="%s"> %s </a>' % (url, text)
        return line 
    #return ' '.join(link(l) for l in lines)
    if len(lines) < 2: 
        return ' '.join(link(l) for l in lines)
    return '<ul>' + ' '.join('<li>%s</li>' % link(l) for l in lines) + '</ul>'
     
def table_from_rows(rows, outnm):
    head = '<table align="left">\n'
    foot = '</table>\n'
    body = ''
    for i, row in enumerate(rows):
        headchar = 'h' if i==0 else 'd'
        body += '%s<tr>\n' % (4*' ')
        for el in row:
            body += '%s<t%s align="left"> %s </t%s>\n' % (8*' ', headchar, linkify(el), headchar)
        body += '%s</tr>\n' % (4*' ')
    with open(outnm, 'w') as f:
        f.write(head+body+foot) 

if __name__=='__main__':
    csvnm, outnm = sys.argv[1:] 
    rows = rows_from_csv(csvnm) 
    table_from_rows(rows, outnm)
