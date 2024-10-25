let searchOption = document.querySelector('#searchOptions');
let button = document.querySelector('button');
let title = document.querySelector('.title');
let resultBoxes;


// Gets direct image link and opens in new tab
let imgDataLoaded = (e) => {
    try {
        // Get XHR object
        let xhr = e.target;

        // Parse
        let results = JSON.parse(xhr.responseText);

        // Open Hi-Res Image
        let open = window.open(results.images[0].image);

        if (open == null || typeof (open) == 'undefined') {
            if (window.confirm("Automatic Opening blocked. Please enable pop-ups!\n\nIf you weren't prompted to enable pop-ups, press OK to override result page with fullsize image :)")) {
                getResultBoxes(`<a id="fullsizeImg" href=${results.images[0].image}><img src=${results.images[0].image}></a>`);
            }
        }
    }
    catch (e) {
        getResultBoxes(`<h2>Error! Nothing Found.</h2>`);
    }
}

// Calls CoverArtArchive API with MBID for direct link
let getCoverArt = (mbid) => {
    // Pass in array of MBIDs

    let xhr = new XMLHttpRequest();

    //Set the onload handler
    xhr.onload = imgDataLoaded;

    let url = `https://coverartarchive.org/release/${mbid}`;

    //Open connection and send request
    xhr.open("GET", url);
    xhr.send();
}

// Takes in result from MusicBrainz API and creates the grid of albums w/ covers
let displayAlbumList = (e) => {
    // Get XHR object
    let xhr = e.target;

    // Parse
    let results = JSON.parse(xhr.responseText);


    let bigString = `<h2>Error! Nothing Found.</h2>`;

    // Sort + Display albums
    results = results.releases;
    if (results === undefined) {
        getResultBoxes(bigString);
        return;
    }
    results = results.filter(result => result["cover-art-archive"].count > 0);

    // Create array of mbid promises
    let covers = [];
    for (let i = 0; i < results.length; i++) {
        covers[i] = `https://coverartarchive.org/release/${results[i].id}`;
    }

    // partially from https://stackoverflow.com/questions/45389677/using-promise-all-to-resolve-fetch-requests
    let requestsArray = covers.map((url) => {
        let request = new Request(url, {
            method: 'GET'
        });

        return fetch(request).then(res => res.json());
    });

    Promise.all(requestsArray).then(allResults => {
        requestsArray = allResults;
    }).then(() => {
        if (requestsArray.length > 0) {
            bigString = ``;
            //Loop through array of results for album search
            for (let i = 0; i < results.length; i++) {
                let result = results[i];

                // Get MBID of result
                let mbid = result.id;

                // Get record name
                let title = result.title;

                // Get artist
                let date = result.date;

                //Build a <div> to hold each result
                let line = `<div class='result' mbid=${mbid}><img mbid=${mbid} src='${requestsArray[i].images[0].thumbnails.small}'>`;
                line += `<span mbid=${mbid}><strong mbid=${mbid}>${title}</strong><br>${date}</span></div>`;

                bigString += line;
            }
        }
    }).then(() => {
        searchOption = 'release';
        getResultBoxes(bigString);
    });
}

// Takes in the MBID of an artist, and returns up to 100 of their releases (calls displayAlbumList)
let getAlbumsFromArtist = (mbid) => {
    let xhr = new XMLHttpRequest();

    //Set the onload handler
    xhr.onload = displayAlbumList;

    let url = `https://musicbrainz.org/ws/2/release?artist=${mbid}&limit=100&fmt=json`;

    //Open connection and send request
    xhr.open("GET", url);
    xhr.send();
}

// Handles clicking a result to do a new search
let onResultClick = (e) => {
    switch (searchOption) {
        case "artist":
            // Call api again w/ this https://musicbrainz.org/ws/2/release?artist=b6b2bb8d-54a9-491f-9607-7b546023b433&fmt=json
            // display results + interactivity as you would album search (change searchOption n stuff)
            button.classList.add('is-loading');
            getAlbumsFromArtist(e.target.getAttribute("mbid"));
            break;
        case "release":
            getCoverArt(e.target.getAttribute("mbid"));
            break;
    }
}

// Displays results of any query + hooks in event listener
let getResultBoxes = (bigString) => {
    document.querySelector("#content").innerHTML = bigString;
    resultBoxes = document.querySelectorAll(".result");
    for (let i = 0; i < resultBoxes.length; i++) {
        resultBoxes[i].addEventListener("click", onResultClick);
    }
    button.classList.remove('is-loading');
}

// Handles the results of all queries
let dataLoaded = (e) => {
    // Get XHR object
    let xhr = e.target;

    // Parse
    let results = JSON.parse(xhr.responseText);

    let bigString = `<h2>Error! Nothing Found.</h2>`;

    // Get correct array according to what type
    nothingFound:
    if (searchOption === 'artist') {
        results = results.artists;

        if (results.length <= 0) {
            getResultBoxes(bigString);
            break nothingFound;
        }

        bigString = ``;
        for (let i = 0; i < results.length; i++) {
            let result = results[i];

            // Get MBID of result
            let mbid = result.id;

            // Get artist name
            let name = result.name;

            // Get artist location
            let location = "Unknown";

            if (result["begin-area"] !== undefined) {
                location = result["begin-area"].name;
            }
            if (result.area !== undefined) {
                location = `${location}, ${result.area.name}`;
            }

            // Get artist disambiguation

            let disambiguation = null

            if (result["disambiguation"] !== undefined) {
                disambiguation = result["disambiguation"]
            }

            //Build a <div> to hold each result
            let line = `<div class='result' mbid=${mbid}>`;
            disambiguation === null ? line += `<span mbid=${mbid}><strong mbid=${mbid}>${name}</strong><br>${location}</span></div>` : line += `<span mbid=${mbid}><strong mbid=${mbid}>${name}</strong><br><span class="is-size-7 is-italic">${disambiguation}</span><br>${location}</span></div>`
            //line += `<span mbid=${mbid}><strong mbid=${mbid}>${name}</strong><br>${location}</span></div>`;

            bigString += line;

        }
        getResultBoxes(bigString);
    }
    else if (searchOption === 'release') {
        results = results.releases;

        if (results.length <= 0) {
            getResultBoxes(bigString);
            break nothingFound;
        }

        bigString = ``;

        // Create array of mbid promises
        let covers = [];
        for (let i = 0; i < results.length; i++) {
            covers[i] = `https://coverartarchive.org/release/${results[i].id}`;
        }

        // partially from https://stackoverflow.com/questions/45389677/using-promise-all-to-resolve-fetch-requests
        let requestsArray = covers.map((url) => {
            let request = new Request(url, {
                method: 'GET'
            });

            return fetch(request).then(res => res.json())
        });
        Promise.allSettled(requestsArray).then(allResults => {
            requestsArray = allResults;
        }).then(() => {
            for (let i = 0; i < requestsArray.length; i++) {
                if (requestsArray[i].status !== "fulfilled") {
                    requestsArray.splice(i, 1);
                    results.splice(i, 1);
                    i--;
                }
            }
        }).then(() => {
            //Loop through array of results for album search
            for (let i = 0; i < results.length; i++) {
                let result = results[i];

                let cover = requestsArray[i].value.images[0].thumbnails.small

                // Get MBID of result
                let mbid = result.id;

                // Get record name
                let title = result.title;

                // Get artist
                let artist = result["artist-credit"][0].name;

                // Convert from HTTP to HTTPS
                cover = cover.slice(0, 4) + 's' + cover.slice(4);

                //Build a <div> to hold each result
                let line = `<div class='result' mbid=${mbid}><img mbid=${mbid} src='${cover}'>`;

                // Add IMG here probably
                line += `<span mbid=${mbid}><strong mbid=${mbid}>${title}</strong><br>${artist}</span></div>`;

                bigString += line;
            }
        }).then(() => {
            // have to have two separate calls so the loading bar doesn't go away too soon
            getResultBoxes(bigString);
        });
    }
}

// Creates an API request with the specified search query
let querySearch = (url, searchOption) => {
    //Create new XHR object
    let xhr = new XMLHttpRequest();

    //Set the onload handler
    xhr.onload = dataLoaded;

    //Open connection and send request
    xhr.open("GET", url);
    xhr.send();
}

// Calls API with MBID to get direct release/artist page w/o needing to search
let mbidSearch = (searchText) => {
    if (searchOption === 'artist') {
        getAlbumsFromArtist(searchText);
    }
    else if (searchOption === 'release') {
        getCoverArt(searchText);
    }
}

// Handles searching when button is clicked or enter key is pressed
let onButtonClick = () => {
    button.classList.add('is-loading');

    // Set Values according to selection
    searchOption = searchOptions.value;
    let radio = document.querySelector('#name').checked ? "name" : "mbid";
    let searchText = document.querySelector('#searchBar').value.trim();
    localStorage.setItem("lastSearch", searchText); //store in local storage,
    let url = `https://musicbrainz.org/ws/2/${searchOption}`;
    let results;

    //Add spaces where need be and cleanup
    searchText = encodeURIComponent(searchText.trim());

    // Check if search or direct MBID query
    if (radio === 'name') {
        url += `?query=${searchText}&fmt=json`
        querySearch(url, searchOption);
    }
    else {
        mbidSearch(searchText);
    }
}

let clearPage = () => {
    document.querySelector('#searchBar').value = '';
    getResultBoxes('');
}

// Add support for enter key
document.querySelector('#searchBar').addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        onButtonClick();
    }
});
button.addEventListener("click", onButtonClick);
title.addEventListener("click", clearPage);