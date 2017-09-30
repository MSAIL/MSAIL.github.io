''' author: samtenka
    changed: 2017-09-29
    created: 2017-09-29
    description: generation HTML table given CSV file
'''

import sys

def rows_from_csv(csvnm, delimiter=';'):
    with open(csvnm) as f:
        lines = f.read().split('\n') 
    return [[w.strip() for w in l.split(delimiter)] for l in lines if l.strip()]
     
def table_from_rows(rows, outnm):
    head = '<table align="center">\n'
    foot = '</table>\n'
    body = ''
    for row in rows:
        body += '%s<tr>\n' % (4*' ')
        for el in row:
            body += '%s<td> %s </td>\n' % (8*' ', el)
        body += '%s</tr>\n' % (4*' ')
    with open(outnm, 'w') as f:
        f.write(head+body+foot) 

if __name__=='__main__':
    csvnm, outnm = sys.argv[1:] 
    rows = rows_from_csv(csvnm) 
    table_from_rows(rows, outnm)
