from bs4 import BeautifulSoup

with open('bento.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

cards = soup.find_all('div', class_='bento-card')
for card in cards:
    label = card.find('code', class_='class-label')
    if label and label.text:
        # label.text contains the missing desktop classes, e.g. 'col-3 row-span-2'
        extra_classes = label.text.strip().split()
        for cls in extra_classes:
            if cls not in card.get('class', []):
                card['class'].append(cls)

with open('bento.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
