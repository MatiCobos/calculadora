class RepartoGastos {
    constructor() {
        this.personas = {};  // Personas que realizaron algún pago
        this.personasNoGastaron = [];  // Lista de personas que no gastaron
        this.totalGastado = 0;
    }

    agregarPersona(nombre, pago = 0) {
        if (pago > 0) {
            this.personas[nombre] = { pago, debePoner: 0, debeRecuperar: 0, saldo: 0 };
        } else {
            this.personasNoGastaron.push(nombre);
        }
        this.calcularTotal();
    }

    registrarGasto(nombre, monto) {
        if (!this.personas[nombre] && !this.personasNoGastaron.includes(nombre)) {
            this.agregarPersona(nombre, monto);
        } else {
            this.personas[nombre].pago += monto;
        }
        this.calcularTotal();
    }

    calcularTotal() {
        // Sumar el total gastado solo por las personas que pagaron algo
        this.totalGastado = Object.values(this.personas).reduce((acc, p) => acc + p.pago, 0);
    }

    calcularSaldos() {
        // Incluir a las personas que no gastaron, asignándoles 0 como gasto
        let totalPersonas = Object.keys(this.personas).length + this.personasNoGastaron.length;
        let equitativo = this.totalGastado / totalPersonas;

        // Calculamos el saldo de cada persona
        Object.keys(this.personas).forEach(nombre => {
            let persona = this.personas[nombre];
            persona.saldo = persona.pago - equitativo;
            if (persona.saldo > 0) {
                persona.debeRecuperar = parseFloat(persona.saldo.toFixed(1));
                persona.debePoner = 0;
            } else {
                persona.debePoner = parseFloat(Math.abs(persona.saldo).toFixed(1));
                persona.debeRecuperar = 0;
            }
        });

        // Las personas que no gastaron tienen que "deber poner" su parte equitativa
        this.personasNoGastaron.forEach(nombre => {
            this.personas[nombre] = { pago: 0, saldo: -equitativo, debePoner: equitativo, debeRecuperar: 0 };
        });
    }

    sugerirTransferencias() {
        let deudores = Object.entries(this.personas).filter(([_, p]) => p.debePoner > 0).sort((a, b) => b[1].debePoner - a[1].debePoner);
        let acreedores = Object.entries(this.personas).filter(([_, p]) => p.debeRecuperar > 0).sort((a, b) => b[1].debeRecuperar - a[1].debeRecuperar);
        let transferencias = [];

        while (deudores.length > 0 && acreedores.length > 0) {
            let [deudor, datosDeudor] = deudores[0];
            let [acreedor, datosAcreedor] = acreedores[0];
            let monto = Math.min(datosDeudor.debePoner, datosAcreedor.debeRecuperar);

            transferencias.push(`${deudor} debe transferir $${monto.toFixed(1)} a ${acreedor}`);
            datosDeudor.debePoner -= monto;
            datosAcreedor.debeRecuperar -= monto;

            if (datosDeudor.debePoner === 0) deudores.shift();
            if (datosAcreedor.debeRecuperar === 0) acreedores.shift();
        }
        return transferencias;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const reparto = new RepartoGastos();
    
    // Añadir persona que pagó
    document.getElementById("agregarPersona").addEventListener("click", () => {
        let nombre = document.getElementById("nombre").value;
        let gasto = parseFloat(document.getElementById("gasto").value) || 0;
        reparto.registrarGasto(nombre, gasto);
        actualizarLista();
    });

    // Añadir persona que no gastó
    document.getElementById("agregarNoGastaron").addEventListener("click", () => {
        let nombreNoGastaron = document.getElementById("personasNoGastaron").value;
        if (nombreNoGastaron) {
            reparto.agregarPersona(nombreNoGastaron, 0);  // Agregar con 0 de gasto
            actualizarListaNoGastaron();
        }
    });

    // Calcular y mostrar los resultados
    document.getElementById("calcular").addEventListener("click", () => {
        reparto.calcularSaldos();
        actualizarLista();
    });

    // Actualizar la lista de personas
    function actualizarLista() {
        let lista = document.getElementById("listaPersonas");
        let total = document.getElementById("totalGastos");
        let sugerencias = document.getElementById("sugerenciasTransferencias");
        lista.innerHTML = "";
        sugerencias.innerHTML = "";
    
        // Mostrar el total gastado
        total.textContent = `Total Gastado: $${reparto.totalGastado.toFixed(1)}`;
    
        // Calcular el monto a dividir entre solo las personas que pagaron
        let personasQueGastaron = Object.keys(reparto.personas).length;
        let montoPorPersona = reparto.totalGastado / personasQueGastaron;
    
        // Mostrar cuánto le corresponde a cada persona (solo las que pagaron)
        total.innerHTML += `<br>Total cada uno: $${montoPorPersona.toFixed(1)}`;
    
        // Mostrar la lista de personas con su respectiva información
        Object.entries(reparto.personas).forEach(([nombre, datos]) => {
            let li = document.createElement("li");
            li.textContent = `${nombre}: Pagó $${datos.pago.toFixed(1)} - Debe poner $${datos.debePoner.toFixed(1)} - Debe recuperar $${datos.debeRecuperar.toFixed(1)}`;
            lista.appendChild(li);
        });
    
        // Sugerencias de transferencias
        let transferencias = reparto.sugerirTransferencias();
        transferencias.forEach(texto => {
            let li = document.createElement("li");
            li.textContent = texto;
            sugerencias.appendChild(li);
        });
    }
    
    

    // Actualizar la lista de personas que no gastaron nada
    function actualizarListaNoGastaron() {
        let listaNoGastaron = document.getElementById("listaNoGastaron");
        listaNoGastaron.innerHTML = "";  // Limpiar la lista antes de agregar nuevos elementos
        reparto.personasNoGastaron.forEach(nombre => {
            let li = document.createElement("li");
            li.textContent = nombre;
            listaNoGastaron.appendChild(li);
        });
    }
});
