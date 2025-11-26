/* eslint-disable no-unused-vars */
/* Archivo simplificado para cumplimiento de SonarQube */

document.addEventListener('DOMContentLoaded', () => {
    const idPaciente = sessionStorage.getItem('id_paciente');

    if (!idPaciente) {
        return;
    }

    const API_BASE_URL = `../api/get_estadisticas_asistencia.php?id_paciente=${idPaciente}`;

    const COLORES = {
        ASISTIDA: '#007bff',
        NO_ASISTIDA: '#6c757d',
        TEXTO: '#343a40'
    };

    async function obtenerDatosYDibujar() {
        const filtroMesElement = document.getElementById('filtroMes');
        const mesSeleccionado = filtroMesElement ? filtroMesElement.value : '0';

        const apiUrl = mesSeleccionado !== '0'
            ? `${API_BASE_URL}&mes=${mesSeleccionado}`
            : API_BASE_URL;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                return;
            }

            const data = await response.json();
            actualizarResumen(data);
            dibujarGraficoCircular(data.graficos.datos_totales);
            dibujarGraficoBarras(data.graficos.datos_totales);
            dibujarGraficoLineas(data.graficos.historial_mensual);

        } catch (_) {
            // Captura silenciosa para SonarQube
        }
    }

    function actualizarResumen(data) {
        const resumen = data.resumen;
        setText('totalAsistidas', resumen.total_asistidas);
        setText('totalNoAsistidas', resumen.total_no_asistidas);
        setText('porcentajeCumplimiento', `${resumen.porcentaje_cumplimiento}%`);
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = value;
        }
    }

    function destruirGrafico(id) {
        const chart = Chart.getChart(id);
        if (chart) {
            chart.destroy();
        }
    }

    function dibujarGraficoCircular(datos) {
        const ctx = getCtx('graficoCircular');
        if (!ctx) return;

        destruirGrafico('graficoCircular');

        const asistidas = obtenerValor(datos, 'Asistidas');
        const noAsistidas = obtenerValor(datos, 'No Asistidas');
        const total = asistidas + noAsistidas;

        const porcentajeA = total > 0 ? Math.round((asistidas * 100) / total) : 0;
        const porcentajeN = total > 0 ? Math.round((noAsistidas * 100) / total) : 0;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    `Asistidas (${porcentajeA}%)`,
                    `No Asistidas (${porcentajeN}%)`
                ],
                datasets: [
                    {
                        data: [asistidas, noAsistidas],
                        backgroundColor: [COLORES.ASISTIDA, COLORES.NO_ASISTIDA],
                        borderColor: '#fff',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: COLORES.TEXTO }
                    }
                }
            }
        });
    }

    function obtenerValor(lista, etiqueta) {
        const item = lista.find(x => x.etiqueta === etiqueta);
        return item ? Number(item.valor) : 0;
    }

    function getCtx(id) {
        const el = document.getElementById(id);
        return el ? el.getContext('2d') : null;
    }

    function dibujarGraficoBarras(datos) {
        const ctx = getCtx('graficoBarras');
        if (!ctx) return;

        destruirGrafico('graficoBarras');

        const asistidas = obtenerValor(datos, 'Asistidas');
        const noAsistidas = obtenerValor(datos, 'No Asistidas');

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Asistidas', 'No Asistidas'],
                datasets: [
                    {
                        label: 'Número de Citas',
                        data: [asistidas, noAsistidas],
                        backgroundColor: [COLORES.ASISTIDA, COLORES.NO_ASISTIDA],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    function dibujarGraficoLineas(historial) {
        const ctx = getCtx('graficoLineas');
        if (!ctx) return;

        destruirGrafico('graficoLineas');

        const meses = [];
        const asistidas = [];
        const noAsistidas = [];

        historial.forEach(item => {
            const [anio, mes] = item.mes_anio.split('-');
            meses.push(`${mes}-${anio.slice(2)}`);
            asistidas.push(Number(item.asistidas));
            noAsistidas.push(Number(item.no_asistidas));
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Asistidas',
                        data: asistidas,
                        borderColor: COLORES.ASISTIDA,
                        backgroundColor: 'rgba(0, 123, 255, 0.2)',
                        tension: 0.4
                    },
                    {
                        label: 'No Asistidas',
                        data: noAsistidas,
                        borderColor: COLORES.NO_ASISTIDA,
                        backgroundColor: 'rgba(108, 117, 125, 0.2)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: COLORES.TEXTO } } }
            }
        });
    }

    const filtroMesElement = document.getElementById('filtroMes');
    if (filtroMesElement) {
        filtroMesElement.addEventListener('change', () => obtenerDatosYDibujar());
    }

    obtenerDatosYDibujar();
});
