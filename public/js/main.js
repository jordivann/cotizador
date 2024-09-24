function consultarTodasLasMarcas() {
  const apiUrl = '/obtener-marcas';

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      llenarMarcasEnDropdown(data.marcas);
      console.log('Marcas obtenidas:', data.marcas.length);
    })
    .catch(error => {
      console.error('Error al cargar las marcas:', error);
    });
}

function llenarMarcasEnDropdown(marcas) {
  const brandDropdown = document.getElementById('brandDropdown');
  brandDropdown.innerHTML = '<option value="">Seleccione una marca</option>';

  marcas.forEach(marca => {
    const option = document.createElement('option');
    option.value = marca.BrandsId;
    option.textContent = marca.NombreMarca;
    brandDropdown.appendChild(option);
  });
}

async function llenarGruposEnDropdown(brandId) {
  const apiUrlGrupos = `/obtener-grupos/${brandId}`;

  try {
    const response = await fetch(apiUrlGrupos);
    const data = await response.json();

    const groupDropdown = document.getElementById('groupDropdown');
    groupDropdown.innerHTML = '<option value="">Seleccione un grupo</option>';

    data.grupos.forEach(grupo => {
      const option = document.createElement('option');
      option.value = grupo.GroupId;
      option.textContent = grupo.NombreGrupo;
      groupDropdown.appendChild(option);
    });

    console.log('Grupos obtenidos:', data.grupos.length);
  } catch (error) {
    console.error('Error al cargar los grupos:', error);
  }
}

function cambiarMarca() {
  const brandDropdown = document.getElementById('brandDropdown');
  const selectedBrandId = brandDropdown.value;

  if (selectedBrandId) {
    llenarGruposEnDropdown(selectedBrandId);
  }
}

// Función para buscar y mostrar modelos usados
async function buscarModelosUsados() {
  const brandDropdown = document.getElementById('brandDropdown');
  const groupDropdown = document.getElementById('groupDropdown');
  const selectedBrandId = brandDropdown.value;
  const selectedGroupId = groupDropdown.value;

  if (!selectedBrandId) {
    alert('Seleccione una marca antes de buscar modelos.');
    return;
  }

  if (!selectedGroupId) {
    alert('Seleccione un grupo antes de buscar modelos.');
    return;
  }

  const apiUrlModelos = `/obtener-modelos-usados/${selectedBrandId}/${selectedGroupId}`;

  try {
    const response = await fetch(apiUrlModelos);
    const data = await response.json();

    console.log('Modelos obtenidos:', data.modelos);

    const modelosTable = document.getElementById('modelos-table');
    const tbody = modelosTable.querySelector('tbody');
    tbody.innerHTML = '';

    data.modelos.forEach(modelo => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = modelo.codia;
      row.insertCell(1).textContent = modelo.description;

      const btnVerPrecios = document.createElement('button');
      btnVerPrecios.textContent = 'Precios';
      btnVerPrecios.className = 'btn btn-precios';
      btnVerPrecios.onclick = () => verPreciosUsados(modelo.codia);
      row.insertCell(2).appendChild(btnVerPrecios);
    });
  } catch (error) {
    console.error('Error al cargar los modelos:', error);
  }
}

// Función para mostrar precios de modelos usados
async function verPreciosUsados(codia) {
  const apiUrlPrecios = `/obtener-precios-usados/${codia}`;

  try {
    const response = await fetch(apiUrlPrecios);
    const data = await response.json();

    console.log('Precios obtenidos:', data.precios);

    const tablaPreciosUsados = document.getElementById('tablaPreciosUsados').getElementsByTagName('tbody')[0];
    tablaPreciosUsados.innerHTML = ''; // Limpiar contenido previo

    data.precios.forEach(precio => {
      const row = tablaPreciosUsados.insertRow();
      row.insertCell(0).textContent = precio.year;
      row.insertCell(1).textContent = `$${precio.price.toLocaleString()}`;
    });

    const modal = new bootstrap.Modal(document.getElementById('preciosModalUsados'));
    modal.show();

  } catch (error) {
    console.error('Error al cargar los precios:', error.message);
    alert('No tenemos disponible actualmente precios para este modelo.');
  }
}

// Función para buscar y mostrar modelos 0KM
async function buscarModelos() {
  const brandDropdown = document.getElementById('brandDropdown');
  const groupDropdown = document.getElementById('groupDropdown');
  const selectedBrandId = brandDropdown.value;
  const selectedGroupId = groupDropdown.value;

  if (!selectedBrandId) {
    alert('Seleccione una marca antes de buscar modelos.');
    return;
  }

  if (!selectedGroupId) {
    alert('Seleccione un grupo antes de buscar modelos.');
    return;
  }

  const apiUrlModelos = `/obtener-casos/${selectedBrandId}/${selectedGroupId}`;

  try {
    const response = await fetch(apiUrlModelos);
    const data = await response.json();

    console.log('Modelos obtenidos:', data.modelos);

    const modelosTable = document.getElementById('modelos-table');
    const tbody = modelosTable.querySelector('tbody');
    tbody.innerHTML = '';

    data.modelos.forEach(modelo => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = modelo.codia;
      row.insertCell(1).textContent = modelo.description;

      const btnVerPrecios = document.createElement('button');
      btnVerPrecios.textContent = 'Ver Precios';
      btnVerPrecios.className = 'btn btn-info';
      btnVerPrecios.onclick = () => verPrecios(modelo.codia);
      row.insertCell(2).appendChild(btnVerPrecios);
    });
  } catch (error) {
    console.error('Error al cargar los modelos:', error);
  }
}

// Función para mostrar precios de modelos 0KM
async function verPrecios(codia) {
  const apiUrlPrecios = `/obtener-precios/${codia}`;

  try {
    const response = await fetch(apiUrlPrecios);
    
    if (!response.ok) {
      throw new Error(`Error al cargar el list_price: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.hasOwnProperty('list_price')) {
      alert('No hay precios disponibles para este modelo 0KM.');
      return;
    }

    const tablaPrecios0km = document.getElementById('tablaPrecios0km').getElementsByTagName('tbody')[0];
    tablaPrecios0km.innerHTML = ''; // Limpiar contenido previo

    const row = tablaPrecios0km.insertRow();
    row.insertCell(0).textContent = 'Año Actual';
    row.insertCell(1).textContent = `$${data.list_price.toLocaleString()}`;

    const modal = new bootstrap.Modal(document.getElementById('preciosModal0km'));
    modal.show();

  } catch (error) {
    console.error('Error al cargar el list_price:', error.message);
    alert('No tenemos disponible actualmente precios para este modelo en 0km.');
  }
}

function filtrarModelos() {
  const searchInput = document.getElementById('searchModel').value.toLowerCase();
  const table = document.getElementById('modelos-table');
  const rows = table.getElementsByTagName('tr');

  for (let i = 1; i < rows.length; i++) {
    const codia = rows[i].getElementsByTagName('td')[0].textContent.toLowerCase();
    const description = rows[i].getElementsByTagName('td')[1].textContent.toLowerCase();

    if (codia.includes(searchInput) || description.includes(searchInput)) {
      rows[i].style.display = '';
    } else {
      rows[i].style.display = 'none';
    }
  }
}
