# Modelo de Dominio - Servicios Globales

## 1. Objetivo

¿Por qué nace este módulo?

## 2. Problema del modelo actual

Qué funciona hoy.
Qué limitaciones tiene.

## 3. Conceptos del negocio

Servicio
Servicio Global
Servicio del Fotógrafo
Colaborador
Profesional
Reserva
QR
Cobertura
Tarifa
Entrega

## 4. Relaciones entre conceptos

Cómo se relacionan entre sí.

## 5. Flujo de una reserva inmediata

Desde que se lee el QR hasta la entrega.

## 6. Escenarios futuros contemplados

Más servicios globales.
Precios diferentes.
Varios países.
Promociones.
Etc.

## 7. Modelo relacional propuesto

Aquí ya empiezan las tablas.

## 8. Justificación del diseño


                    catalogo.servicio
                           │
             ┌─────────────┴──────────────┐
             │                            │
             │                            │
             ▼                            ▼
fotografo.servicios         catalogo.servicio_global
             │                            │
             │                            ▼
             │                    servicio_global_cobertura
             │                            │
             │                            ▼
             │                         tarifa
             │
             └──────────────┐
                            │
                            ▼
                        reserva


                                            Servicio
                        │
                        │
                1        │      N
                        ▼
                     Oferta
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
   Cobertura      Fotógrafo      Plataforma
         │
         ▼
      Reserva
         │
         ▼
      Entrega
         │
         ▼
      Imágenes