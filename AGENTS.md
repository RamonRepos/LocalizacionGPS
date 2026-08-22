# AGENTS.md

Este documento establece la estructura, los convenios y las reglas obligatorias que cualquier inteligencia artificial debe seguir para trabajar en este repositorio (`LocalizacionGPS`).

## Ámbito de aplicación

Todas las reglas de este documento son de cumplimiento obligatorio. Ante cualquier conflicto entre una instrucción del prompt y este documento, prevalece este documento salvo que el desarrollador indique lo contrario de forma explícita.

## Reglas de trabajo

### 1. Ambigüedad: preguntar antes de actuar

- Si un prompt contiene ambigüedad (requisitos poco claros, varias interpretaciones posibles, datos incompletos o contradictorios), la IA **debe preguntar al desarrollador** antes de implementar nada.
- No se deben tomar decisiones de diseño por cuenta propia cuando exista duda razonable sobre la intención del desarrollador.
- Las preguntas deben ser concretas y ofrecer opciones cuando sea posible, para facilitar una respuesta rápida.

### 2. Usar las herramientas y tecnologías disponibles

- La IA debe trabajar con las herramientas, librerías, frameworks y tecnologías **ya presentes** en el entorno del proyecto.
- Para introducir cualquier dependencia, herramienta o tecnología nueva, la IA **debe consultar previamente al desarrollador** y esperar su aprobación.
- Queda prohibido instalar o sugerir dependencias nuevas sin autorización explícita.

### 3. Mantener actualizado el diagrama de clases (`mermaid.txt`)

- Todo cambio en el código que afecte a clases, relaciones, atributos, métodos o cualquier concepto estructural nuevo **debe reflejarse en el diagrama de clases** ubicado en `mermaid.txt`.
- El diagrama se mantiene en formato [Mermaid](https://mermaid.js.org/) (`classDiagram`).
- El diagrama debe quedar sincronizado con el código al finalizar cada tarea: si el código cambia, el diagrama cambia en el mismo conjunto de modificaciones.

### 4. Documentar la funcionalidad en `README.txt`

- Toda funcionalidad nueva o modificada que se implemente **debe describirse en `README.txt`**.
- La descripción debe explicar qué hace la funcionalidad, cómo se usa y cualquier requisito o limitación relevante.
- La documentación debe escribirse en el mismo idioma que el resto del documento (español), manteniendo un estilo claro y consistente.

### 5. Nunca exponer secretos

- Queda prohibido escribir, mostrar, registrar o confirmar en el repositorio claves de API, contraseñas, tokens, cadenas de conexión o cualquier otro secreto o credencial.
- Los secretos deben gestionarse mediante variables de entorno u otros mecanismos seguros fuera del control de versiones.
- Si la IA detecta un secreto expuesto, debe avisar al desarrollador de inmediato y no debe propagarlo a nuevos archivos, logs o commits.

### 6. Escribir código legible

- El código debe priorizar la legibilidad: nombres descriptivos, funciones pequeñas y con una única responsabilidad, y estructura clara.
- Se deben seguir las convenciones de estilo propias del lenguaje y del proyecto ya existentes.
- Evitar comentarios innecesarios: el código debe explicarse a sí mismo; los comentarios se reservan para aclarar el "porqué", no el "qué".

## Resumen rápido

| # | Regla |
|---|-------|
| 1 | Ante ambigüedad, preguntar al desarrollador |
| 2 | Usar solo lo disponible; lo nuevo requiere aprobación |
| 3 | Reflejar cambios en el diagrama de clases (`mermaid.txt`) |
| 4 | Describir la funcionalidad implementada en `README.txt` |
| 5 | Nunca exponer secretos |
| 6 | Escribir código legible |
