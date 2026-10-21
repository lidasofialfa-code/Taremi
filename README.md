# Taremi

**Tu guía para navegar el sistema de salud.** Prototipo de una app asistente con IA para personas que cuidan la salud de su familia en Colombia.

Proyecto de diseño UX/UI hecho por **Lida Alfonso** en el bootcamp de BIT (Bogotá Institute of Technology), 2026. Sigue en desarrollo.

**Probar el prototipo:** [enlace al prototipo]

## Qué es

Quien cuida a alguien con una condición crónica termina convertida en administradora: fechas, órdenes, autorizaciones ante la EPS. Si se le pasa un día, puede perder meses de espera. Taremi se anticipa: te recibe con lo que tienes pendiente, te recuerda qué llevar a la cita, guarda lo que quieres preguntarle al médico y te dice qué sigue en cada trámite.

## Qué hace el prototipo

- Cuatro espacios: **Inicio** (lo pendiente), **Chat con Taremi**, **Calendario** y **Bóveda** (los documentos).
- Cuatro tipos de trámite: citas, exámenes con resultado, medicamentos por entregas y autorizaciones. Cada trámite es una conversación.
- Escanear o subir un documento y que Taremi diga qué entendió y de quién es.
- Guardar preguntas para la consulta y verlas el día de la cita.
- Un botón "Tengo un problema" en cada estado del trámite.
- Un chat que dice cuándo no sabe: "Eso no lo sé, no tengo ese dato".

## Qué es real y qué está simulado

Es un prototipo para probar la experiencia, no una app en producción.

- **Simulado:** el paso del tiempo, la lectura de los documentos y los avisos. Por eso no uses datos reales.
- **No hay servidor:** todo corre en el navegador.
- **Aún no hay pruebas de usabilidad formales** con personas que cuidan.

## Cómo lo hice

Yo investigué, definí qué debía resolver el diseño y tomé las decisiones. Construí el prototipo con Claude Code, bajo mi dirección: yo explico qué se necesita, la herramienta lo programa y yo lo pruebo y lo corrijo.

- Investigación: 3 entrevistas a cuidadoras, mapas de empatía, journey map y auditoría de las apps de las EPS.
- Arquitectura de información, user flows y sistema de diseño.
- Accesibilidad WCAG 2.2 AA, con contrastes medidos.
- Auditorías de usabilidad con los cinco planos de Garrett y las Leyes de UX, y auditoría de microcopy.

## Tecnología

HTML, CSS y JavaScript, sin dependencias. Para verlo en local, abre `index.html` en el navegador.

## Contacto

Lida Alfonso · [LinkedIn](https://www.linkedin.com/in/lida-alfonso-ux-designer) · Portafolio: [enlace]
