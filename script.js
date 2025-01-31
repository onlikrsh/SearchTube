const API_KEY = 'AIzaSyCnbDjBtKJZgB3_xDFa9RKawCjjQMmAejA';


const searchBtn = document.getElementById('searchButton');
const results = document.getElementById('resultsContainer');
const Input = document.getElementById('searchInput');
// const bonusIcon = document.getElementById('leftIcon');

function clearSearch() {
    Input.value = '';
    Input.focus();
}

searchBtn.addEventListener('click', () => {
    const query = Input.value.trim();
    if(query) {
        searchTube(query);
    } else {
        results.innerHTML = '<p>Please enter a search term.</p>';
    }
});

function searchTube(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video,playlist,channel&key=${API_KEY}`;

    fetch(url)
    .then(response => {
        if(!response.ok) {
            throw new Error('Failed to fetch data from Youtube API');

        }
        return response.json();
    })
    .then(data => {
        displayResults(data.items);
    })
    .catch(error => {
        results.innerHTML = `<p>Error: ${error.message}</p>`;
        console.error('Error: ', error);
    });
}

function displayResults(items) {
    results.innerHTML = '';

    if (items.length === 0) {
        results.innerHTML = '<p>No results found.</p>';
        return;
    }

    items.forEach(item => {
        const { snippet, id } = item;

        let url = '#';
        if (id.videoId) {
            url = `https://www.youtube.com/watch?v=${item.id.videoId}`;
        } else if (id.playlistId) {
            url = `https://www.youtube.com/playlist?list=${item.id.playlistId}`;
        } else if (id.channelId) {
            url = `https://www.youtube.com/channel/${item.id.channelId}`;
        }

        const resultElement = document.createElement('div');
        resultElement.classList.add('result');

        resultElement.innerHTML = `
        <div class="thumbnail">
           <a href="${url}" target="_blank" rel="noopener noreferrer">
                <img src="${snippet.thumbnails.medium.url} alt="${snippet.title}">
            </a>
        </div>
        <div class="info">
            <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${snippet.title}</a></h3>
            <p>${snippet.description}</p>
        </div>
        `;

        results.appendChild(resultElement);

    });

}












// Input.addEventListener('focus', () => {
//     Input.style.width = '400px'; 
//     Input.style.transition = 'width 0.3s ease';
//     bonusIcon.style.display = 'flex'; 
// });
  
// Input.addEventListener('blur', () => {
//     Input.style.width = '340px'; 
//     bonusIcon.style.display = 'none';
// });

