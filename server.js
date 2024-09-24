const axios = require('axios');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const url = process.env.URL;
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
let ACCESSTOKEN;

// Función para obtener y renovar el token de acceso
const loginAndGetToken = async () => {
  try {
    const credentials = Buffer.from(`${email}:${password}`).toString('base64');
    const headers = { 'Authorization': `Basic ${credentials}` };

    const response = await axios.post(url, null, { headers });

    if (response.status === 200) {
      ACCESSTOKEN = response.data.access_token;
      console.log('Token de acceso obtenido con éxito');
    } else if (response.status === 401) {
      console.log('Error de autenticación. Verifica las credenciales.');
    } else {
      console.log('Error en la solicitud. Código de estado:', response.status);
    }
  } catch (error) {
    console.error('Error al realizar la solicitud:', error.message);
  }
};

// Ejecutar la función de obtención de token al iniciar y renovarlo cada 30 minutos
loginAndGetToken().then(() => {
  setInterval(() => {
    loginAndGetToken();
  }, 30 * 60 * 1000);
});

// Configuración de EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar carpeta pública para archivos estáticos
app.use(express.static('public'));
app.use(cors());

// Middleware para verificar el token antes de cada solicitud
app.use((req, res, next) => {
  if (!ACCESSTOKEN) {
    return res.status(503).json({ error: 'El token de acceso no está disponible. Intente de nuevo más tarde.' });
  }
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.render('index');
});

// Obtener marcas
app.get('/obtener-marcas', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const allData = await obtenerTodasLasMarcas(apiUrl, ACCESSTOKEN);
    res.json({ marcas: allData });
  } catch (error) {
    console.error('Error al obtener las marcas:', error.message);
    res.status(500).json({ error: 'Error al obtener las marcas' });
  }
});

// Obtener grupos por ID de marca
app.get('/obtener-grupos/:brandId', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const brandId = req.params.brandId;
    const allData = await obtenerTodosLosGrupos(apiUrl, ACCESSTOKEN, brandId);
    res.json({ grupos: allData });
  } catch (error) {
    console.error(`Error al obtener los grupos de la marca con ID ${req.params.brandId}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
});

// Obtener modelos usados por ID de marca y grupo
app.get('/obtener-modelos-usados/:brandId/:groupId', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const { brandId, groupId } = req.params;
    const allData = await obtenerTodosLosModelos(apiUrl, ACCESSTOKEN, brandId, groupId);
    res.json({ modelos: allData });
  } catch (error) {
    console.error(`Error al obtener los modelos de la marca con ID ${brandId} y grupo con ID ${groupId}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los modelos' });
  }
});

// Ya existente...
// ...

// Obtener precios usados por CODIA
app.get('/obtener-precios-usados/:codia', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const codia = req.params.codia;
    const allData = await obtenerTodosLosPrecios(apiUrl, ACCESSTOKEN, codia);
    res.json({ precios: allData });
  } catch (error) {
    console.error(`Error al obtener los precios del modelo con CODIA ${codia}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los precios' });
  }
});

// Obtener list_price por CODIA para modelos 0KM
app.get('/obtener-precios/:codia', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const codia = req.params.codia;
    const listPrice = await obtenerListPrice(apiUrl, ACCESSTOKEN, codia);
    res.json({ list_price: listPrice });
  } catch (error) {
    console.error(`Error al obtener el list_price del modelo con CODIA ${codia}:`, error.message);
    res.status(500).json({ error: 'Error al obtener el list_price' });
  }
});

// ...

// Obtener modelos 0KM por ID de marca y grupo
app.get('/obtener-casos/:brandId/:groupId', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const { brandId, groupId } = req.params;
    const allData = await obtenerTodosLosModelos0KM(apiUrl, ACCESSTOKEN, brandId, groupId);
    res.json({ modelos: allData });
  } catch (error) {
    console.error(`Error al obtener los modelos de la marca con ID ${brandId} y grupo con ID ${groupId}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los modelos' });
  }
});

// Funciones auxiliares

async function obtenerTodasLasMarcas(apiUrl, ACCESSTOKEN) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      return response.data.map(marca => ({
        BrandsId: marca.id,
        NombreMarca: marca.name
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de marcas:`, error.message);
      throw error;
    }
  }

  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1 && pagesData.length > 0) {
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

async function obtenerTodosLosGrupos(apiUrl, ACCESSTOKEN, brandId) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands/${brandId}/groups?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      return response.data.map(grupo => ({
        GroupId: grupo.id,
        NombreGrupo: grupo.name
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de grupos:`, error.message);
      throw error;
    }
  }

  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1 && pagesData.length > 0) {
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

async function obtenerTodosLosModelos(apiUrl, ACCESSTOKEN, brandId, groupId) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands/${brandId}/groups/${groupId}/models?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      return response.data.map(modelo => ({
        codia: modelo.codia,
        description: modelo.description
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de modelos:`, error.message);
      throw error;
    }
  }

  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1 && pagesData.length > 0) {
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

async function obtenerTodosLosPrecios(apiUrl, ACCESSTOKEN, codia) {
  try {
    const response = await axios.get(`${apiUrl}/models/${codia}/prices`, {
      headers: {
        'Authorization': `Bearer ${ACCESSTOKEN}`
      }
    });

    return response.data.map(precio => ({
      year: precio.year,
      price: precio.price * 1000
    }));
  } catch (error) {
    console.error(`Error al obtener los precios del modelo con CODIA ${codia}:`, error.message);
    throw error;
  }
}

async function obtenerListPrice(apiUrl, ACCESSTOKEN, codia) {
  try {
    const response = await axios.get(`${apiUrl}/models/${codia}/list_price`, {
      headers: {
        'Authorization': `Bearer ${ACCESSTOKEN}`
      }
    });

    if (!response.data || !response.data.list_price) {
      throw new Error('No se encontró el precio de lista.');
    }

    return response.data.list_price * 1000;
  } catch (error) {
    console.error(`Error al obtener el list_price del modelo con CODIA ${codia}:`, error.message);
    throw error;
  }
}

async function obtenerTodosLosModelos0KM(apiUrl, ACCESSTOKEN, brandId, groupId) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands/${brandId}/groups/${groupId}/models?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      const filteredModels = response.data.filter(modelo => modelo.list_price > 0);

      return filteredModels.map(modelo => ({
        codia: modelo.codia,
        description: modelo.description
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de modelos:`, error.message);
      throw error;
    }
  }

  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1 && pagesData.length > 0) {
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
