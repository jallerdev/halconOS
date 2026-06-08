'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// Tour guiado de la app (driver.js). Se lanza automáticamente la primera vez
// (flag en localStorage) y se puede repetir con el botón "?" del TopBar, que
// despacha el evento `halcon:start-tour`. Los pasos se anclan a elementos con
// `data-tour="..."` (ver Sidebar y la página de leads). Sin estado en DB.
const TOUR_FLAG = 'halcon:tour:done';

const STEPS: DriveStep[] = [
  {
    popover: {
      title: '👋 Bienvenido a HalcónOS',
      description:
        'Te muestro en 1 minuto cómo trabajar tus leads y cerrar ventas. Puedes salir cuando quieras y repetir este tour con el botón “?” de arriba.',
    },
  },
  {
    element: '[data-tour="nav-leads"]',
    popover: {
      title: 'Tus leads',
      description:
        'Aquí ves los leads que tienes asignados. Cada uno es un negocio al que puedes contactar para venderle.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="leads-table"]',
    popover: {
      title: 'Tu lista de trabajo',
      description:
        'Esta es tu bandeja: busca, filtra y abre cualquier lead para ver sus datos de contacto, llamarlo o escribirle por WhatsApp.',
    },
  },
  {
    element: '[data-tour="nav-discover"]',
    popover: {
      title: 'Descubrir negocios',
      description:
        'Busca negocios nuevos en Google Maps e impórtalos como leads con un clic. Lo que importes queda asignado a ti.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-today"]',
    popover: {
      title: 'Tu día',
      description:
        'Aquí aparecen los seguimientos vencidos y los de hoy. Empieza tu jornada por acá para no perder ningún cliente.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-pipeline"]',
    popover: {
      title: 'Pipeline',
      description:
        'Visualiza tus leads por etapa, desde “Por contactar” hasta “Ganado”. Arrástralos para avanzarlos.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-projects"]',
    popover: {
      title: 'Proyectos',
      description:
        'Cuando cierres una venta, el lead se convierte en un proyecto que se gestiona aquí.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-import"]',
    popover: {
      title: 'Importar',
      description:
        '¿Tienes una lista en Excel o CSV? Súbela aquí para crear muchos leads de una sola vez.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-settings"]',
    popover: {
      title: 'Ajustes',
      description:
        'Conecta tu cuenta de Google para agendar reuniones con enlace de Meet directamente desde un lead.',
      side: 'right',
      align: 'start',
    },
  },
  {
    popover: {
      title: '🚀 Tu flujo ideal',
      description:
        'Revisa “Hoy” → abre un lead → llama o escríbele por WhatsApp → márcalo como contactado → programa el siguiente seguimiento. ¡Éxitos con tus ventas!',
    },
  },
];

function buildTour() {
  return driver({
    showProgress: true,
    allowClose: true,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Atrás',
    doneBtnText: 'Listo',
    progressText: '{{current}} de {{total}}',
    steps: STEPS,
  });
}

export function ProductTour() {
  useEffect(() => {
    const start = () => buildTour().drive();
    const onStart = () => start();
    document.addEventListener('halcon:start-tour', onStart);

    // Auto-lanzar una sola vez (primer login). Pequeño delay para que el
    // sidebar (anclas data-tour) ya esté montado.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== 'undefined' && localStorage.getItem(TOUR_FLAG) !== '1') {
      localStorage.setItem(TOUR_FLAG, '1');
      timer = setTimeout(start, 900);
    }

    return () => {
      document.removeEventListener('halcon:start-tour', onStart);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
