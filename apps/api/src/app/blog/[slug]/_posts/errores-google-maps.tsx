import Link from 'next/link';

// Post: 5 errores comunes al cazar leads en Google Maps
// Target keyword: "cómo buscar leads en Google Maps"
// Long-tail: prospección Google Maps, extraer leads de Google, lead generation local.
export function ErroresGoogleMapsPost() {
  return (
    <>
      <p className="lead-callout">
        <strong>Resumen rápido:</strong> Google Maps es la mejor base de datos B2B local que existe.
        Pero la mayoría la usa mal. Estos cinco errores te están costando deals y tiempo.
      </p>

      <h2>Por qué Google Maps es oro para prospección B2B local</h2>
      <p>
        Cada negocio físico en LatAm está en Google Maps con su nombre, dirección, teléfono,
        rating, reseñas y categoría. Es una <strong>base de datos pública, gratis, hyper-local
        y actualizada en tiempo real</strong>. Para una agencia que vende a negocios locales,
        es literalmente donde están todos tus clientes futuros.
      </p>
      <p>
        El problema: la mayoría hace lo mismo. Copia 50 nombres a un Excel, manda el mismo
        WhatsApp a todos, se quema. Veamos cinco errores específicos y cómo arreglarlos.
      </p>

      <h2>Error #1: no filtrar por intención de compra</h2>
      <p>
        Buscar &quot;cafetería Medellín&quot; te devuelve 200 cafeterías. <strong>No todas tienen el
        mismo nivel de interés en tus servicios</strong>.
      </p>
      <p>Las señales que sí indican interés:</p>
      <ul>
        <li>
          <strong>Rating 4.0+ con 30+ reseñas</strong> — el negocio factura. Tiene presupuesto.
        </li>
        <li>
          <strong>Sin web</strong> — gap obvio que tú puedes resolver. Pitch cae solo.
        </li>
        <li>
          <strong>Tiene Instagram activo pero web débil</strong> — está invirtiendo en marketing
          pero no de forma profesional.
        </li>
        <li>
          <strong>Reseñas recientes ({'<'} 6 meses)</strong> — operación activa, no zombie.
        </li>
      </ul>
      <p>
        Si filtras solo por estas 4 señales, tu lista de 200 baja a 20-40 leads <em>realmente
        contactables</em>. Tu tasa de respuesta se va de 1% a 10-15%.
      </p>

      <h2>Error #2: copiar manualmente nombre por nombre</h2>
      <p>
        Una hora copy-pasteando de Google Maps a Excel es una hora que NO usaste contactando
        leads. La fricción te mata. Veamos los caminos:
      </p>

      <h3>Camino lento (lo que NO hagas)</h3>
      <ol>
        <li>Buscar &quot;X categoría Y ciudad&quot; en Google Maps.</li>
        <li>Abrir cada negocio uno por uno.</li>
        <li>Copiar nombre, teléfono, web a tu Excel.</li>
        <li>Repetir 50 veces. Después de 1 hora, tienes 30 negocios con la mitad de la data
          mal copiada.</li>
      </ol>

      <h3>Camino rápido</h3>
      <ol>
        <li>
          Abre <Link href="/discover">HalcónOS / Descubrir</Link>.
        </li>
        <li>Escribe categoría + ciudad → click Buscar.</li>
        <li>Aplica filtros: Sin web, Rating 4+, Solo operativos.</li>
        <li>Selecciona los que te interesen → Importar al CRM.</li>
        <li>En 2 minutos: 20 leads con todos los campos completos en tu pipeline.</li>
      </ol>
      <p>Pasaste de 1 hora a 2 minutos. Y eso ANTES de empezar a contactar.</p>

      <h2>Error #3: mandar el mismo mensaje a todos</h2>
      <p>
        Pongamos esto en claro: <strong>WhatsApp no es un canal de masas</strong>. Si mandas
        100 mensajes iguales, te van a marcar como spam y Meta te baneará el número en menos
        de una semana.
      </p>
      <p>
        Personalización mínima viable (PMV) — toma 30 segundos por mensaje:
      </p>
      <blockquote>
        Hola [Nombre del dueño], vi tu cafetería en [zona] — tienes muy buenas reseñas (4.6 en
        Google!). Soy [Tu nombre] y ayudo a cafeterías como la tuya a tener web sin pagar
        mantenimiento mensual. ¿Tienes 5 minutos esta semana para ver un ejemplo?
      </blockquote>
      <p>
        Tres anclajes que no se pueden faltar:
      </p>
      <ul>
        <li>
          <strong>Nombre del dueño</strong> (sacar de la web si la tiene, o usar el nombre del
          negocio si no).
        </li>
        <li>
          <strong>Una observación específica</strong> (rating, zona, algo que demuestre que NO es
          spam).
        </li>
        <li>
          <strong>Una oferta concreta</strong> con un CTA específico (&quot;5 minutos esta
          semana&quot;).
        </li>
      </ul>

      <h2>Error #4: no trackear quién dijo qué y cuándo</h2>
      <p>
        Si llegaste a contactar 50 leads y mañana no recuerdas quién te dijo &quot;mándame info
        en marzo&quot;, perdiste el deal. La memoria humana es terrible para volúmenes B2B.
      </p>
      <p>
        Lo mínimo que necesitas trackear por lead:
      </p>
      <ul>
        <li>Fecha de primer contacto.</li>
        <li>Status actual: NEW / CONTACTADO / CALIFICADO / PROPUESTA / GANADO / PERDIDO.</li>
        <li>Próximo follow-up programado.</li>
        <li>Notas: &quot;Llamar después del 15 de junio&quot;, &quot;quiere ver casos previos&quot;.</li>
      </ul>
      <p>
        Un pipeline kanban hace esto trivial. Cada lead es un card que vas moviendo de
        columna en columna. Si usas <Link href="/">HalcónOS</Link>, esto ya viene de fábrica.
      </p>

      <h2>Error #5: no medir tasas de conversión</h2>
      <p>
        Si no sabes cuántos contactos = 1 reunión, y cuántas reuniones = 1 deal, estás conduciendo
        a ciegas. Las métricas mínimas:
      </p>
      <table>
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Benchmark sano</th>
            <th>Qué te dice</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tasa de respuesta WhatsApp</td>
            <td>8-15%</td>
            <td>Si es menor → tu mensaje es spam o filtro malo</td>
          </tr>
          <tr>
            <td>Reuniones / respuestas positivas</td>
            <td>40-60%</td>
            <td>Si es menor → tu pitch no es relevante</td>
          </tr>
          <tr>
            <td>Deals cerrados / reuniones</td>
            <td>20-30%</td>
            <td>Si es menor → tu propuesta o precio no convencen</td>
          </tr>
        </tbody>
      </table>
      <p>
        Mide. Cada semana revisa tus números. <strong>El cuello de botella aparece donde el
        número está mucho abajo del benchmark</strong> — ahí ataca.
      </p>

      <h2>Cómo se ve hacerlo bien (caso típico)</h2>
      <p>
        Una agencia de Medellín con 2 personas. Nicho: restaurantes con buena calificación pero
        sin web. Volumen mensual:
      </p>
      <ul>
        <li>500 leads descubiertos (5 búsquedas por semana).</li>
        <li>200 contactos efectivos (filtrados por las 4 señales arriba).</li>
        <li>25 respuestas positivas (12.5% tasa).</li>
        <li>12 reuniones cerradas (48%).</li>
        <li>3 deals firmados (25%).</li>
      </ul>
      <p>
        A un ticket promedio de $1.500 USD por proyecto, eso son $4.500 USD al mes de un sistema
        de prospección de 1-2h/día. <strong>Replicable</strong>. <strong>Predecible</strong>.
      </p>

      <h2>Tu siguiente paso</h2>
      <p>
        Si tu agencia depende del boca a boca: empieza esta semana. Define UN nicho, descubre
        100 leads, filtra, contacta 20 al día. En 30 días tendrás respuestas medibles.
      </p>
      <p>
        Si quieres ahorrarte el setup manual: <Link href="/sign-up">prueba HalcónOS 14 días
        gratis</Link>. La parte de descubrir + filtrar + personalizar + trackear está hecha.
        Tú solo tienes que aprender a contactar bien.
      </p>
    </>
  );
}
