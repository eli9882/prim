//Se declara las variables  y se inicializan como un array vacío. Esta variable se utilizarán para almacenar.
let markers = [];
let initialPolylines = [];
let shortestPathPolylines = [];
let routes = [];
let addedCoordinates = [];

// Esta función se utilizará para inicializar el mapa de Google.
function initMap() {
  
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 3
    });
}
//Funcion para limpiar el mapa
function clearMap() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    for (let i = 0; i < initialPolylines.length; i++) {
        initialPolylines[i].setMap(null);
    }
    initialPolylines = [];
    for (let i = 0; i < shortestPathPolylines.length; i++) {
        shortestPathPolylines[i].setMap(null);
    }
    shortestPathPolylines = [];
      

}

function resetRoutesAndCoordinates() {
    routes = [];
    addedCoordinates = [];
}

// Llamar a esta función cuando se desee limpiar las rutas y coordenadas
function clearRoutesAndCoordinates() {
    // Limpiar rutas y coordenadas
    resetRoutesAndCoordinates();

    // Ocultar la sección de información
    const infoSection = document.getElementById('info');
    infoSection.style.display = 'none';

    // Limpiar el mapa
    clearMap();
}
//Funcion para agregar la ruta
function addRoute() {
    const routeInput = document.getElementById('route').value;
    const [lat, lng] = routeInput.split(',').map(parseFloat);
    
    if (!isNaN(lat) && !isNaN(lng)) {
        //Se crea un objeto newCoord que almacena las coordenadas en un formato más legible.
        const newCoord = { lat, lng };
     const isAlreadyAdded = addedCoordinates.some(coord => coord.lat === newCoord.lat && coord.lng === newCoord.lng);
        if (isAlreadyAdded) {
            alert('Estas coordenadas ya han sido agregadas previamente.');
            document.getElementById('route').value = '';
        } else {
            // Agregar las coordenadas y mostrar la ruta en el mapa
            routes.push(newCoord);//se agrega a la lista de rutas almacenadas.
            addedCoordinates.push(newCoord);//se añaden a la lista de coordenadas previamente agregadas.
            document.getElementById('route').value = '';
            showRouteOnMap(newCoord);
            // Ocultar la sección de información
    const infoSection = document.getElementById('info');
    infoSection.style.display = 'none';
        }
    } else {
        alert('Por favor, ingresa valores válidos para la ruta (Latitud, Longitud).');
    }
}


//Funcion para mostrar las rutas en el mapa
function showRouteOnMap(coord) {
    // Muestra un marcador en la ubicación de la ruta
    const marker = new google.maps.Marker({
        position: coord, // Define la posición del marcador usando las coordenadas proporcionadas
        map: map, // Asocia el marcador con el mapa en el que se mostrará
        label: (markers.length + 1).toString() // Etiqueta numérica para el marcador
   
    });

    // Agregar evento de clic al marcador para eliminarlo
marker.addListener('click', () => {
    deleteRouteByCoordinates(coord.lat, coord.lng);
});
    // Agrega el marcador al array 'markers'
    markers.push(marker);

    // Dibuja las lineas rojas entre la nueva ruta y las rutas existentes 
       for (let i = 0; i < markers.length - 1; i++) {
        const sourceCoord = markers[i].getPosition(); // Obtiene la posición del marcador existente
        const targetCoord = coord; // Define la posición de la nueva ruta
        const edgePolyline = new google.maps.Polyline({
            path: [sourceCoord, targetCoord], // Define los puntos que conectan la polilínea
            geodesic: true, // Crea una línea siguiendo la curvatura de la Tierra
            strokeColor: '#FF0000', 
            strokeOpacity: 1.0, 
            strokeWeight: 2, 
            map: map  
        });
        // Agrega la nueva polilínea al array 'initialPolylines'
        initialPolylines.push(edgePolyline);
    }

    // Centra y ajusta el mapa para mostrar todos los marcadores y polilíneas
    const bounds = new google.maps.LatLngBounds(); // Crea un límite para la vista del mapa
    for (let i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition()); // Expande el límite para incluir cada posición de marcador
    
    }
    map.fitBounds(bounds); // Ajusta la vista del mapa para mostrar todos los elementos

}



function showInitialGraph() {
    // Limpiar el mapa primero
    clearMap();
  
    // Mostrar todas las rutas en el mapa
    for (const route of routes) {
        showRouteOnMap(route);
    }
  
    // Centrar y ajustar el mapa para mostrar todos los marcadores y polilíneas
    const bounds = new google.maps.LatLngBounds(); // Crear límites para el ajuste del mapa
    //recorre todos los marcadores en el array markers y extiende los límites geográficos almacenados en 
    //el objeto bounds para incluir la posición de cada marcador. 
    for (let i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition()); // Extender los límites con la posición de cada marcador
    }
    map.fitBounds(bounds); // Ajustar el mapa para que encaje en los límites
  }
  
function calculateDistanceAndShortestPath() {
        // Verificar si hay al menos dos rutas para calcular
        if (routes.length < 2) {
            alert('Por favor, agrega al menos dos rutas para calcular la distancia y el camino mas corto.');
            return;
        }
 // Limpiar el mapa primero
clearMap();

// Limpiar las polilíneas del camino más corto anteriores (líneas verdes)
for (let i = 0; i < shortestPathPolylines.length; i++) {
    shortestPathPolylines[i].setMap(null); // Elimina la polilínea del mapa
}
shortestPathPolylines = []; // Reinicia el array de polilíneas del camino más corto

const coordinates = routes; // Utilizar directamente el arreglo de rutas

const graph = []; // Declarar un arreglo para representar el grafo


// Construir la matriz de adyacencia para el grafo
for (let i = 0; i < coordinates.length; i++) {
    graph.push([]); // Agregar un nuevo array vacío para representar las conexiones de un vértice
    for (let j = 0; j < coordinates.length; j++) {
        if (i === j) {
            graph[i][j] = Infinity; // La distancia de un vértice a sí mismo es infinita
        } else {
            // Calcular la distancia geodésica entre los puntos utilizando la función de Google Maps API
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(coordinates[i]),
                new google.maps.LatLng(coordinates[j])
            );
            graph[i][j] = distance;
        }
    }
}


    // Aplicar el algoritmo de Prim para obtener el árbol de expansión mínima
    const minSpanningTree = prim(graph);

    // Dibujar las aristas del árbol de expansión mínima en el mapa
    const shortestPathCoordinates = [];
    for (let i = 1; i < minSpanningTree.length; i++) {
        const sourceIndex = minSpanningTree[i];
        const targetIndex = i;
        const sourceCoord = coordinates[sourceIndex];
        const targetCoord = coordinates[targetIndex];
        shortestPathCoordinates.push(sourceCoord, targetCoord);

        calculateAndDrawRealRoute(sourceCoord, targetCoord);
   
    }
// Calcular la distancia total de la ruta y la cantidad de cable de fibra óptica necesaria para la ruta más corta
let totalDistance = 0;
let totalCableDistance = 0;
for (let i = 1; i < shortestPathCoordinates.length; i += 2) {
    const sourceCoord = shortestPathCoordinates[i - 1];
    const targetCoord = shortestPathCoordinates[i];
    
    // Calcular la distancia geodésica entre las coordenadas utilizando la función de Google Maps API
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(sourceCoord),
        new google.maps.LatLng(targetCoord)
    );
    const distanceInKilometers = distance / 1000; // Convertir a kilómetros

    totalDistance += distanceInKilometers;
    totalCableDistance += distance;
}

// Mostrar la distancia y la cantidad de cable en el index
const distanceElement = document.getElementById('distance');
const fiberCableElement = document.getElementById('fiberCable');

distanceElement.textContent = `${totalDistance.toFixed(2)} km`;
fiberCableElement.textContent = `${totalCableDistance.toFixed(2)} x m`;
// Mostrar la sección de información
const infoSection = document.getElementById('info');
infoSection.style.display = 'block';

    // Clear previous markers and polylines for shortest path
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    // Show markers for all points in the shortest path
    shortestPathCoordinates.forEach((coord, index) => {
        markers.push(new google.maps.Marker({
            position: coord,
            map: map,
            label: (index + 1).toString(),
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }));
    });

    // Center and fit the map to show all markers and polylines
    const bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }
    map.fitBounds(bounds);

    
}

function calculateAndDrawRealRoute(sourceCoord, targetCoord) {
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
        {
            origin: sourceCoord,
            destination: targetCoord,
            travelMode: google.maps.TravelMode.DRIVING // Utilizar el modo de viaje en coche
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                // Dibujar la ruta real en el mapa
                const realPath = new google.maps.Polyline({
                    path: result.routes[0].overview_path,
                    geodesic: true,
                    strokeColor: '#00FF00',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    map: map
                });
                shortestPathPolylines.push(realPath);
            }
        }
    );
}
function prim(graph) {
    const numVertices = graph.length; // Número de vértices en el grafo
    const selected = new Array(numVertices).fill(false); // Array para rastrear los vértices seleccionados
    const minDistances = new Array(numVertices).fill(Infinity); // Array para almacenar las distancias mínimas
    const minSpanningTree = new Array(numVertices).fill(-1); // Array para almacenar el árbol de expansión mínima

    minDistances[0] = 0; // Inicializamos la distancia mínima del vértice 0 como 0
    minSpanningTree[0] = 0; // No hay vértice previo para el vértice 0

    for (let i = 0; i < numVertices - 1; i++) {
        const u = getMinDistanceVertex(selected, minDistances); // Obtenemos el vértice con la distancia mínima
        selected[u] = true; // Marcamos el vértice como seleccionado

        for (let v = 0; v < numVertices; v++) {
            if (graph[u][v] !== 0 && !selected[v] && graph[u][v] < minDistances[v]) {
                // Si hay una arista entre u y v, v no está seleccionado y el peso es menor
                minSpanningTree[v] = u; // Actualizamos el vértice previo en el árbol de expansión mínima
                minDistances[v] = graph[u][v]; // Actualizamos la distancia mínima
            }
        }
    }

    return minSpanningTree; // Devolvemos el árbol de expansión mínima
}

function getMinDistanceVertex(selected, minDistances) {
    let min = Infinity; // Valor inicial para comparación de distancia mínima
    let minIndex = -1; // Índice del vértice con distancia mínima
    for (let v = 0; v < selected.length; v++) {
        if (!selected[v] && minDistances[v] < min) {
            // Si el vértice no está seleccionado y su distancia es menor que el mínimo actual
            min = minDistances[v]; // Actualizamos el valor mínimo
            minIndex = v; // Actualizamos el índice del vértice con distancia mínima
        }
    }
    return minIndex; // Devolvemos el índice del vértice con distancia mínima
}


function deleteRoute() {
    const deleteRouteInput = document.getElementById('deleteRoute').value;
    const [deleteLat, deleteLng] = deleteRouteInput.split(',').map(parseFloat);

    if (!isNaN(deleteLat) && !isNaN(deleteLng)) {
        deleteRouteByCoordinates(deleteLat, deleteLng);
    } else {
        alert('Por favor, ingresa coordenadas válidas (Latitud, Longitud) para eliminar la ruta.');
    }
}


function deleteRouteByCoordinates(lat, lng) {
    const indexToDelete = routes.findIndex(route => route.lat === lat && route.lng === lng);

    if (indexToDelete !== -1) {
        // Mostrar una ventana de confirmación antes de eliminar
        const confirmed = window.confirm('¿Estas segura/o de que deseas eliminar esta ruta?');

        if (confirmed) {
            // Eliminar el marcador correspondiente a la ruta
            const deletedMarker = markers.splice(indexToDelete, 1)[0];
            deletedMarker.setMap(null);

            // Eliminar las polilíneas relacionadas con la ruta eliminada
            for (let i = 0; i < initialPolylines.length; i++) {
                initialPolylines[i].setMap(null);
            }
            initialPolylines = [];

            // Eliminar la ruta del arreglo de rutas
            const deletedRoute = routes.splice(indexToDelete, 1)[0];

            // Eliminar las coordenadas de la lista addedCoordinates
            const deletedCoordIndex = addedCoordinates.findIndex(coord => coord.lat === lat && coord.lng === lng);
            if (deletedCoordIndex !== -1) {
                addedCoordinates.splice(deletedCoordIndex, 1);
            }

            // Mostrar nuevamente el grafo inicial
            showInitialGraph();

            // Si ya se calculó la ruta más corta, recalcularla
            if (shortestPathPolylines.length > 0) {
                calculateDistanceAndShortestPath();
            }
        }
    } else {
        alert('No se encontró una ruta con las coordenadas especificadas.');
    }
}

















