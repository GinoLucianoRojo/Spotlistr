function Track(query) {
	this.originalQuery = query;
	this.cleanedQuery = this.normalizeSearchQuery(query);
	/* spotifyMatches is an array of 0-n songs on Spotify that matched the given query
	   There are 3 cases for data in this array
	   1. 0 items - this query returned no results on Spotify
	   2. 1 item - there was an exact match on Spotify
	   3. n items (where n > 0) - there were multiple matches on Spotify
	*/
	this.spotifyMatches = [];
	this.selectedMatch = -1;
	this.downloadUrl = '';
	this.sourceUrl = '';
};

Track.prototype.generateSoundcloudDownloadUrl = function(client_id) {
	if (this.downloadUrl) {
		return this.downloadUrl + '?client_id=' + client_id;
	}
	return null;
};

Track.prototype.trackLength = function() {
	var track = this.getSelectedSong(),
		totalSeconds = track.duration_ms / 1000,
		seconds = parseInt(totalSeconds % 60),
		minutes = parseInt((totalSeconds - seconds) / 60);

	return ('00' + minutes).slice(-2) + ':' + ('00' + seconds).slice(-2);
};

Track.prototype.setSelectedMatch = function(index) {
	if (index < 0 || index > this.spotifyMatches.length - 1) {
		throw new Error('Selected Match out of bounds');
	}
	this.selectedMatch = index;
};

Track.prototype.getSelectedSong = function() {
	if (this.spotifyMatches.length === 0) {
		return null;
	} else if (this.spotifyMatches.length === 1) {
		return this.spotifyMatches[0];
	} else {
		return this.spotifyMatches[this.selectedMatch];
	}
};

Track.prototype.normalizeSearchQuery = function(query) {
	var normalized = query;
	// Remove any genre tags in the formation [genre]
	// NOTE: This is pretty naive
	normalized = normalized.replace(/\[(\w*|\s*|\/|-)+\]/gi, '');
	// Remove the time listings in the format [hh:mm:ss]
	normalized = normalized.replace(/(\[(\d*)?:?\d+:\d+\])/, '');
	// Remove the year tags in the format [yyyy] or (yyyy)
	normalized = normalized.replace(/(\[|\()+\d*(\]|\))+/, '');
	// Remove all the extraneous stuff
	normalized = normalized.replace(/[^\w\s]/gi, '');
	return normalized;
};

Track.prototype.createDisplayNameForSelectedSong = function() {
	return this.createDisplayName(this.getSelectedSong());
};

Track.prototype.createDisplayName = function(track) {
	return this.artist() + ' - ' + track.name;
};

Track.prototype.artist = function() {
	var track = this.getSelectedSong(),
		result = '';
	for (var i = 0; i < track.artists.length; i += 1) {
		if (i < track.artists.length - 1) {
			result += track.artists[i].name + ', ';
		} else {
			result += track.artists[i].name;
		}
	}
	return result;
};

Track.prototype.createSpotifyUriForTrack = function(index) {
	return 'spotify:track:' + this.spotifyMatches[index];
};

Track.prototype.addSpotifyMatches = function(matches) {
	for (var i = 0; i < matches.length; i += 1) {
		this.spotifyMatches.push(matches[i]);
	}
	if (this.spotifyMatches.length > 1) {
		this.selectedMatch = 0;
	}
};

Track.prototype.createExportText = function(options) {
	var result = [];
	var track = this.spotifyMatches[0] || null;
	if (!track) {
		return result;
	}

	if (options.title) {
		result.push(track.name);
	}
	if (options.artist) {
		result.push(track.artists.map(function(artist) { return artist.name; }).join(';'));
	}
	if (options.album) {
		result.push(track.album.name);
	}
	if (options.length) {
		function msToTime(s) {

			function addZ(n) {
				return (n < 10 ? '0' : '') + n;
			}

			var ms = s % 1000;
			s = (s - ms) / 1000;
			var secs = s % 60;
			s = (s - secs) / 60;
			var mins = s % 60;
			var hrs = (s - mins) / 60;
			var result = '';

			return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
		}
		result.push(msToTime(track.duration_ms));
	}
	if (options.spotifyId) {
		result.push(track.id);
	}
	return result.join(' ' + options.separator + ' ');
}
