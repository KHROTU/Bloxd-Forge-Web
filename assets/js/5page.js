let allRows = [];

function renderCards(filter = "") {
  const container = document.getElementById('cards');
  container.innerHTML = '';

  const filtered = allRows.filter(row => {
    if (row.length < 5) return false;
    const [url, img, name, author, tags] = row;
    const text = `${name} ${author} ${tags}`.toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  if (filtered.length === 0) {
    container.textContent = "No builds found.";
    return;
  }

  filtered.forEach(row => {
    const [url, img, name, author, tags] = row;

    const card = document.createElement('div');
    card.className = 'card';

    const image = document.createElement('img');
    image.src = img;
    image.alt = name;

    const content = document.createElement('div');
    content.className = 'card-content';

    content.innerHTML = `
      <div class="name">${name}</div>
      <div class="author">By ${author}</div>
      <div class="tags">${tags}</div>
    `;

    const downloadBtn = document.createElement('a');
    downloadBtn.href = url;
    downloadBtn.textContent = 'Download';
    downloadBtn.className = 'btn-download';
    downloadBtn.setAttribute('download', '');
    downloadBtn.setAttribute('target', '_blank');

    content.appendChild(downloadBtn);
    card.appendChild(image);
    card.appendChild(content);
    container.appendChild(card);
  });
}

fetch('../data/builds.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    renderCards();

    document.getElementById('search').addEventListener('input', (e) => {
      renderCards(e.target.value);
    });
  })
  .catch(err => {
    document.getElementById('cards').textContent = 'Failed to load builds.xlsx';
    console.error(err);
  });   