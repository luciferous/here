function watchPosition(options) {
  if (!navigator.geolocation) throw new Error("Geolocation not supported.");
  const q = asyncqueue();
  navigator.geolocation.watchPosition(q.offer, q.fail, options);
  return q;
}

function ll(position) {
  return [position.coords.longitude, position.coords.latitude];
}

function newPerson(url) {
  var el = document.createElement("div");
  el.className = "person";
  el.style.backgroundImage = "url(" + url + ")";
  return new mapboxgl.Marker(el);
}

function main(container) {
  mapboxgl.accessToken = "pk.eyJ1IjoibmV1bWFuIiwiYSI6ImNpcXhkaTAwNDAxZW9ma204cGp2d2RwZGIifQ.P0eiTzHLtsKjMm7KYV3ung";
  const positions = watchPosition({ enableHighAccuracy: true });
  positions.poll().then(function(position) {
    const center = ll(position);
    const map = new mapboxgl.Map({
      container: container.id,
      style: "mapbox://styles/mapbox/dark-v9",
      center: center,
      zoom: 15
    });
    map.on("load", function() {
      const picURL = "https://secure.gravatar.com/avatar/aa33fb5af8232b00d58261d13ead2b87?size=60";
      const person = newPerson(picURL);
      person.setLngLat(center).addTo(map);
      loop(positions, person, map);
    });
  });
}

function loop(positions, person, map) {
  positions.poll().then(function(position) {
    const newPos = ll(position);
    console.info("center", newPos);
    map.jumpTo({ center: newPos });
    person.setLngLat(newPos);
    loop(positions, person, map);
  });
}
