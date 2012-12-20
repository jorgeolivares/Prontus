#!/usr/bin/perl

# -------------------------------COMENTARIO GLOBAL---------------
# ---------------------------------------------------------------
# PROPOSITO.
# -----------
# Funciones para controlar maximo de instancias de un script en ejecucion

# ---------------------------------------------------------------
# HISTORIAL DE VERSIONES.
# -----------------------
# 1.0.0 - 06/2008 - YCC - Primera version.
# 1.0.1 - 08/2009 - YCC - Mejora conteo de instancias, agregando el grep -v sh -c, para evitar
# interferencias en el conteo al ejecutar un script via crontab
# 1.0.2 - 10/2010 - YCC - Elimina soporte windows.

# -------------------------------BEGIN LIBRERIA------------------
# ---------------------------------------------------------------
# DECLARACIONES GLOBALES.
# ------------------------

package lib_maxrunning;

# ---------------------------------------------------------------
# SUB-RUTINAS.
# ---------------------------------------------------------------

# ---------------------------------------------------------------
sub myselfRunning {
# Retorna las copias de del script que se encuentran corriendo.
    my($res) = qx/ps axww | grep $0 | grep -v ' grep ' | grep -v 'sh -c' | wc -l/;
    $res =~ s/\D//gs;
    return $res;
}; # myselfRunning

# ---------------------------------------------------------------
sub maxExcedido {
# Aborta si hay mas de $max copias corriendo.
    my($max) = $_[0];

    if (&myselfRunning() > $max) {
        return 1; # max excedido, abortar
    };

    return 0;
}; # maxRunning
# ---------------------------------------------------------------
1;
# -------------------------------END LIBRERIA--------------------