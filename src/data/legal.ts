/** Contenido editable de páginas legales / confianza. Ajusta textos con Cleoh. */

export type FaqItem = {
  question: string;
  answer: string;
};

export type PolicySection = {
  /** Ancla para enlaces del footer (ej. /politicas#privacidad). */
  id?: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const faqItems: FaqItem[] = [
  {
    question: "¿Cuánto tarda el envío?",
    answer:
      "Depende del método que elijas en el checkout. Estafeta Terrestre suele tardar 3–5 días hábiles; DHL Express, 1–3 días hábiles. Los plazos empiezan cuando el pedido se marca como enviado y pueden variar por zona o temporada.",
  },
  {
    question: "¿Hacen envíos a todo México?",
    answer:
      "Sí. Enviamos a todo el país con paquetería. El costo y tiempo exactos se muestran al finalizar la compra según la opción que elijas.",
  },
  {
    question: "¿Cómo elijo mi talla?",
    answer:
      "Usa nuestra guía de tallas (Extra Chica a Grande) midiendo pecho y cintura. Si dudas entre dos tallas, te recomendamos la mayor. Si el modelo tiene copa, trabajamos referencia B–C.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Puedes pagar con Mercado Pago (tarjetas y medios disponibles en su checkout), con PayPal o por transferencia/depósito bancario (SPEI) a nuestra cuenta BBVA. Si pagas por transferencia, realiza el pago y envía tu comprobante por Instagram (@cleoh_lenceria) con tu número de pedido; validamos el pago manualmente antes de preparar tu envío. Los precios están en pesos mexicanos (MXN).",
  },
  {
    question: "¿Cómo pago por transferencia bancaria?",
    answer:
      "En el checkout elige «Depósito y transferencia». Al confirmar tu pedido verás los datos de nuestra cuenta BBVA (titular: Bricia J Elizalde). Transfiere el total exacto y manda tu comprobante por Instagram (@cleoh_lenceria) indicando tu número de pedido. Validamos el pago manualmente y te avisamos por correo cuando quede confirmado.",
  },
  {
    question: "¿Puedo usar un cupón?",
    answer:
      "Sí. En el checkout hay un campo para código. El cupón CLEOH10 aplica 10% de descuento cuando esté activo. Un cupón por pedido; no se combina con otras promociones salvo que indiquemos lo contrario.",
  },
  {
    question: "¿Cómo rastreo mi pedido?",
    answer:
      "Cuando tu pedido salga, te enviamos un correo con el código de rastreo y el enlace de la paquetería. Si no lo ves, revisa spam o escríbenos por Instagram (@cleoh_lenceria).",
  },
  {
    question: "¿Puedo cambiar o devolver una prenda?",
    answer:
      "Por la naturaleza íntima de nuestras piezas, no manejamos devoluciones ni cambios por preferencia de talla o gusto. Te invitamos a revisar la guía de tallas antes de comprar; si dudas, escríbenos por Instagram y te orientamos. Si algo llegó dañado o distinto a lo que pediste, cuéntanos por Instagram en los primeros días con tu número de pedido y fotos — queremos ayudarte a resolverlo.",
  },
  {
    question: "¿Las fotos son exactas al color?",
    answer:
      "Cuidamos la fotografía, pero el tono puede variar un poco según pantalla e iluminación. Si algo no coincide con la descripción, escríbenos y lo revisamos.",
  },
];

export const politicasSections: PolicySection[] = [
  {
    title: "Atención al cliente",
    paragraphs: [
      "En Cleoh queremos que compres con calma. Si tienes dudas de talla, pedido o envío, escríbenos por Instagram (@cleoh_lenceria). Respondemos en horario de atención, normalmente en 24–48 horas hábiles.",
      "Conserva tu número de pedido (aparece en el correo de confirmación); con eso te ayudamos más rápido.",
    ],
  },
  {
    title: "Privacidad y datos",
    paragraphs: [
      "Usamos tus datos solo para procesar pedidos, enviar confirmaciones y, si lo autorizas, novedades de la tienda. No vendemos tu información a terceros.",
      "En el checkout pedimos nombre, correo, teléfono y dirección de envío. El pago lo procesan Mercado Pago o PayPal de forma cifrada; las transferencias bancarias se validan manualmente al recibir tu comprobante. Nosotros no guardamos los datos completos de tu tarjeta.",
      "Puedes pedirnos la actualización o eliminación de tus datos de contacto escribiéndonos por redes, salvo la información que debamos conservar por obligaciones fiscales o de pedidos.",
    ],
  },
  {
    title: "Pagos",
    paragraphs: [
      "Los precios se muestran en MXN e incluyen IVA cuando aplica según la operación. Al pagar, el cargo se realiza a través del proveedor que elijas:",
    ],
    bullets: [
      "Mercado Pago (tarjetas y otros medios que habilite)",
      "PayPal",
      "Transferencia o depósito bancario (SPEI) — comprobante por Instagram (@cleoh_lenceria)",
    ],
  },
  {
    title: "Productos y disponibilidad",
    paragraphs: [
      "El stock se actualiza en la tienda. Si un artículo se agota durante el pago, te contactaremos para ajustar el pedido o reembolsar lo correspondiente.",
      "Las descripciones, materiales y cuidados aparecen en cada ficha. Lava según la etiqueta; el encaje y las piezas delicadas requieren cuidado especial.",
    ],
  },
  {
    title: "Mayoreo",
    paragraphs: [
      "Si te interesa mayoreo o colaboraciones, escríbenos por Instagram (@cleoh_lenceria) con el asunto “Mayoreo” y te compartimos condiciones según volumen y zona.",
    ],
  },
];

export const enviosSections: PolicySection[] = [
  {
    title: "Envíos",
    paragraphs: [
      "Enviamos a todo México. En compras con subtotal desde $1,000 MXN el envío va por nuestra cuenta y no hace falta elegir paquetería. Si el pedido no alcanza ese monto, en el checkout eliges el método y ves el costo y el tiempo estimado antes de pagar.",
    ],
    bullets: [
      "Estafeta Terrestre — envío estándar (aprox. 3–5 días hábiles)",
      "DHL Express — entrega más rápida (aprox. 1–3 días hábiles)",
    ],
  },
  {
    title: "Preparación y rastreo",
    paragraphs: [
      "Preparamos tu pedido después de confirmar el pago. Cuando salga, te enviamos por correo el código de rastreo y el enlace de la paquetería.",
      "Los plazos son días hábiles y pueden variar por zona, clima, festivos o volumen de la paquetería. Cleoh no controla retrasos ajenos a nuestro almacén una vez entregado el paquete al courier.",
    ],
  },
  {
    title: "Dirección y recepción",
    paragraphs: [
      "Verifica que la dirección, colonia, CP y teléfono estén correctos. Un error puede retrasar o devolver el paquete. Si el envío regresa por datos incorrectos o ausencia reiterada, el reenvío puede tener costo adicional.",
      "Si el paquete aparece entregado y no lo recibiste, contacta primero a la paquetería con tu guía y avísanos para ayudarte a dar seguimiento.",
    ],
  },
  {
    title: "Pedidos con detalle",
    paragraphs: [
      "Por higiene y el carácter íntimo de la lencería, no manejamos devoluciones ni cambios por preferencia de talla, color o gusto. Antes de comprar, revisa la guía de tallas; si tienes duda, escríbenos por Instagram (@cleoh_lenceria) y te ayudamos a elegir.",
      "Si tu pedido llegó dañado, incompleto o no corresponde a lo que compraste, contáctanos por Instagram dentro de los 5 días hábiles siguientes a la entrega, con fotos y tu número de pedido. Revisamos cada caso con cuidado para encontrar la mejor solución.",
    ],
  },
  {
    title: "Cupones y promociones",
    paragraphs: [
      "Los cupones tienen reglas propias (porcentaje, vigencia, usos). No son acumulables salvo que indiquemos lo contrario. El descuento se aplica sobre el subtotal de productos, no sobre el envío, a menos que la promoción lo especifique.",
    ],
  },
];
