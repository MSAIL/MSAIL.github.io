with open('member_list.csv') as f:
    lines = [l.strip().split(',') for l in f.read().split('\n')[1:] if l]
    data_by_name = {(displayname if displayname else fullname):(email, fullname) for 
                    (username, email, fullname, displayname) in lines} 
    
def translate(names_string):
    emails_fullnames = [data_by_name[name.strip()] for name in names_string.replace('@', '').split(',')]
    for e,f in sorted(emails_fullnames):
        print('%s,\t%s,\t%s' % (e.split('@')[0] if e.endswith('@umich.edu') else e,f.split()[0],' '.join(f.split()[1:])))

translate('@kojimano, @xinyutan, @wytian, @Nisha, @Thomas Huang, @Joey, @Nicholas Szerman, @choang, @prtejas, @seanstapleton, @rishi, @sam, @Samiur Khan, @jrectorb')
