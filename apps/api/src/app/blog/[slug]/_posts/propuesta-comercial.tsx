import Link from 'next/link';

// Post: Plantilla de propuesta comercial que cierra
// Target keyword: "plantilla propuesta comercial"
// Long-tail: propuesta comercial agencia, cómo hacer una propuesta de venta.
export function PropuestaComercialPost() {
  return (
    <>
      <p className="lead-callout">
        <strong>Resumen rápido:</strong> una propuesta efectiva tiene 6 secciones, 4-6 páginas, y
        se entrega en menos de 24h después de la reunión. Aquí está la plantilla exacta — con
        ejemplos de qué SÍ y qué NO escribir.
      </p>

      <h2>Por qué tus propuestas no cierran</h2>
      <p>
        La razón #1 por la que una propuesta NO cierra no es el precio. Es el tiempo de entrega
        + claridad. Si mandas la propuesta 5 días después de la reunión, el cliente ya enfrió.
        Si la propuesta tiene 30 páginas con generalidades, no la lee.
      </p>
      <p>
        Las propuestas que cierran comparten 3 cosas:
      </p>
      <ul>
        <li><strong>Entrega rápida</strong> (menos de 24h).</li>
        <li><strong>Estructura corta</strong> (4-6 páginas).</li>
        <li><strong>Lenguaje específico al cliente</strong>, no template genérica.</li>
      </ul>

      <h2>La estructura de 6 secciones</h2>
      <p>
        Cada sección tiene UN trabajo. No mezcles. Si tu propuesta no cabe en este formato,
        estás escribiendo de más.
      </p>

      <h3>1. Portada (1 párrafo)</h3>
      <p>
        Una frase con el nombre del cliente + 1 línea de lo que vas a entregar. Sin logos
        gigantes ni texto de marketing genérico.
      </p>
      <blockquote>
        <strong>Propuesta para [Cliente]</strong> · Sitio web + setup de Instagram Ads
        para [Negocio del cliente]. Listo en 21 días.
      </blockquote>

      <h3>2. Contexto: cómo te entendí (1 párrafo)</h3>
      <p>
        Aquí demuestras que escuchaste en la reunión. Resumes lo que el cliente te contó EN SUS
        PALABRAS. Si te equivocas aquí, no importa el precio.
      </p>
      <blockquote>
        <strong>El contexto:</strong> Vendes café de especialidad en una zona donde compites con
        7 marcas. Tu tráfico de Instagram está estable pero no convierte a ventas. Tienes 4.7
        estrellas en Google pero no tienes web — la gente busca tu menú y no encuentra. Tu
        objetivo: aumentar pedidos directos en un 30% en 3 meses.
      </blockquote>

      <h3>3. Solución propuesta (3-5 viñetas)</h3>
      <p>
        Qué vas a hacer, concreto. NO &quot;estrategia integral de marketing digital&quot;. Sí
        &quot;sitio web con menú actualizable + integración con Wompi + sistema de cupones&quot;.
      </p>
      <blockquote>
        <strong>Lo que voy a entregar:</strong>
        <ul>
          <li>Sitio web responsive de 5 páginas (Home, Menú, Ubicación, Contacto, Pedidos).</li>
          <li>Sistema de pedidos online con pago integrado (Wompi).</li>
          <li>Setup de Google Business Profile optimizado para SEO local.</li>
          <li>Campaña de Instagram Ads inicial ($200 USD de presupuesto) con 3 creatividades.</li>
        </ul>
      </blockquote>

      <h3>4. Cronograma (1 tabla)</h3>
      <p>
        Una tabla con semanas y entregables. NO un diagrama de Gantt elaborado. Mantén simple.
      </p>
      <table>
        <thead>
          <tr>
            <th>Semana</th>
            <th>Entregable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Wireframes + brand kit acordados</td>
          </tr>
          <tr>
            <td>2-3</td>
            <td>Desarrollo del sitio + integración Wompi</td>
          </tr>
          <tr>
            <td>4</td>
            <td>QA + setup Google Business Profile</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Launch + lanzamiento de Ads + handover</td>
          </tr>
        </tbody>
      </table>

      <h3>5. Inversión (con 2-3 opciones)</h3>
      <p>
        <strong>Siempre da opciones</strong>. La gente compra cuando elige; si solo das un
        precio, el comprador decide entre &quot;sí&quot; y &quot;no&quot;. Si das 3 opciones,
        decide entre las 3.
      </p>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Incluye</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Básico</td>
            <td>Sitio web + Google Profile</td>
            <td>$1.200 USD</td>
          </tr>
          <tr>
            <td>Recomendado</td>
            <td>Básico + sistema pedidos online + Ads</td>
            <td>$2.400 USD</td>
          </tr>
          <tr>
            <td>Premium</td>
            <td>Recomendado + soporte mensual 3 meses</td>
            <td>$3.600 USD</td>
          </tr>
        </tbody>
      </table>
      <p>
        El truco: <strong>marca el de en medio como &quot;Recomendado&quot;</strong>. La mayoría
        elige el del medio (anchor effect). Estarías cerrando ~$2.400 en vez de $1.200.
      </p>

      <h3>6. Próximos pasos (3 líneas máximo)</h3>
      <p>
        Cierra con qué pasa SI dicen que sí. No con &quot;quedo atento a comentarios&quot; — eso
        deja la pelota del lado del cliente y muere el deal.
      </p>
      <blockquote>
        <strong>Si te suena bien:</strong>
        <ol>
          <li>Responde este email confirmando el plan.</li>
          <li>Te mando link de pago con anticipo del 50%.</li>
          <li>Empezamos el lunes siguiente.</li>
        </ol>
      </blockquote>

      <h2>Errores que matan tu propuesta</h2>
      <h3>❌ Listar todos tus servicios</h3>
      <p>
        El cliente NO quiere saber que también haces branding y redes sociales. Quiere saber
        cómo le vas a resolver SU problema. Una propuesta es enfocada, no un catálogo.
      </p>

      <h3>❌ Hablar de ti antes que del cliente</h3>
      <p>
        Si la primera página dice &quot;Somos una agencia con 5 años de experiencia&quot; — el
        cliente cierra el PDF. Empieza por ÉL, sus problemas, su contexto. De ti se habla al
        final (en una sección de &quot;sobre la agencia&quot; de 1 párrafo, opcional).
      </p>

      <h3>❌ Precios sin contexto</h3>
      <p>
        &quot;$2.400 USD&quot; sin nada más es ansiedad pura. SIEMPRE pon qué incluye y qué NO
        incluye. Y siempre da 2-3 opciones.
      </p>

      <h3>❌ Tardarte más de 24h</h3>
      <p>
        Cada día que pasa después de la reunión es un 20% menos de probabilidad de cierre. Si la
        reunión fue el martes, la propuesta debe estar el miércoles AM en su inbox. Sin
        excepciones.
      </p>

      <h2>Cómo bajar el tiempo de propuesta a 30 minutos</h2>
      <p>
        El secreto: NO escribes propuestas desde cero. Tienes una plantilla base que llenas con
        4 datos:
      </p>
      <ol>
        <li>Nombre del cliente.</li>
        <li>Contexto (lo que te dijo).</li>
        <li>Solución propuesta (bullets concretos).</li>
        <li>Precio (3 opciones).</li>
      </ol>
      <p>
        Con <Link href="/">HalcónOS</Link>, la IA te ayuda a generar la propuesta a partir
        del contexto del lead — entrada: lo que sabes del negocio. Salida: el borrador con las
        6 secciones llenas. Tú editas, exportas a PDF y envías. <strong>15 minutos en vez de
        2 horas</strong>.
      </p>

      <h2>Plantilla descargable</h2>
      <p>
        Tienes dos opciones para bajar esta plantilla:
      </p>
      <ul>
        <li>
          <strong>Versión Google Docs</strong> — copia este post completo, pégalo en un doc
          nuevo y llénalo con tus datos. Gratis siempre.
        </li>
        <li>
          <strong>Versión automatizada en HalcónOS</strong> — generación con IA + export a PDF
          + link firmable por el cliente. <Link href="/sign-up">14 días gratis sin tarjeta</Link>.
        </li>
      </ul>

      <h2>Cierre</h2>
      <p>
        Una propuesta que cierra tiene 6 secciones, máximo 6 páginas, se entrega en menos de 24h,
        y se enfoca 100% en el problema del cliente. <strong>El precio NO es el factor
        decisivo</strong> — la claridad sí.
      </p>
      <p>
        Si arreglas tu plantilla de propuesta esta semana, tu tasa de cierre puede pasar del 15%
        al 30-40%. Y si automatizas el proceso, vas a cerrar más sin trabajar más.
      </p>
    </>
  );
}
