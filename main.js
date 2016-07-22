function getLocation() {
  if ("geolocation" in navigator) {
    return new Promise(function(ok, fail) {
      navigator.geolocation.getCurrentPosition(ok, fail);
    });
  } else {
    return Promise.reject(new Error("No geolocation"));
  }
}

function ll(position) {
  return [position.coords.longitude, position.coords.latitude];
}

function displayPerson(map, lnglat, url) {
  var el = document.createElement("div");
  el.className = "person";
  el.style.backgroundImage = "url(" + url + ")";
  console.info(el);

  // add marker to map
  new mapboxgl.Marker(el)
    .setLngLat(lnglat)
    .addTo(map);
}

function main(container) {
  getLocation().then(function(position) {
    const center = ll(position);
    mapboxgl.accessToken = "pk.eyJ1IjoibmV1bWFuIiwiYSI6ImNpcXhkaTAwNDAxZW9ma204cGp2d2RwZGIifQ.P0eiTzHLtsKjMm7KYV3ung";
    const map = new mapboxgl.Map({
      container: container.id,
      style: "mapbox://styles/mapbox/dark-v9",
      center: center,
      zoom: 15
    });

    map.on("load", function() {
      const picURL = "https://secure.gravatar.com/avatar/aa33fb5af8232b00d58261d13ead2b87?size=60";
      displayPerson(map, center, picURL);
    });
  });
}
