/* js/config.js — constantes de negocio centralizadas. Cargar ANTES que las vistas en index.html */
const THRESHOLDS = {
  CRITICO: 4.30,     // sucursal en estado crítico
  BAJO: 4.60,        // bajo desempeño / umbral regional objetivo
  EXCELENTE: 4.80,   // desempeño sobresaliente
  DOWN: 4.50         // indicador visual "a la baja" en tarjetas de trimestre
};

const NEGATIVE_STARS_MAX = 2; // reseña cuenta como queja/alerta si stars <= este valor

const COMPLAINT_KEYWORDS = {
  servicio: ["servicio", "atencion", "mesero", "meser", "cajero", "cajer", "tarde", "tard", "espera", "esper", "demora", "demor", "trato", "grosero", "groser", "actitud", "limpieza", "limp", "sucio", "fila", "caja", "personal", "mal servicio", "lento", "tade", "tardaron", "amabilidad"],
  calidad: ["comida", "crepa", "ingrediente", "fria", "frio", "quema", "sabor", "malo", "rancio", "pelo", "mosca", "insipido", "calidad", "cruda", "crudo", "queso", "massa", "masa", "sucio"],
  valor: ["caro", "precio", "costo", "porcion", "tamaño", "chico", "diminuto", "estafa", "robo", "carisimo", "abusivo", "cantidad"]
};

