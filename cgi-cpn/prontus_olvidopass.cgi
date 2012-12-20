#!/usr/bin/perl

# -------------------------------COMENTARIO GLOBAL---------------
# ---------------------------------------------------------------
# PROPOSITO .
# -----------
# Desplegar página "Olvide mi contrasena"
# ---------------------------------------------------------------
# LLAMADAS A ARCHIVOS EXTERNOS.
# ------------------------------

# ---------------------------------------------------------------
# INVOCACIONES ACEPTADAS.
# ------------------------
# 2) Desde la pag. de ingreso al Sistema.
# ---------------------------------------------------------------
# PLANTILLAS HTML UTILIZADAS.
# ------------------------
# No registra.
# ---------------------------------------------------------------
# Prontus 10 - YCH - Ver detalles en /release_prontus9.txt
# -------------------------------BEGIN SCRIPT--------------------
# ---------------------------------------------------------------
# DECLARACIONES GLOBALES.
# ------------------------

BEGIN {
    # Captura STDERR
    use lib_stdlog;
    &lib_stdlog::set_stdlog($0, 51200);
};

use prontus_varglb; &prontus_varglb::init();
use glib_html_02;
use glib_cgi_04;

use lib_prontus;
use glib_fildir_02; # Prontus 6.0

use strict;
use File::Copy;



# ---------------------------------------------------------------
# MAIN.
# -------------

my (%FORM);

main: {
  my ($lnk);

  # Rescatar parametros recibidos
  &glib_cgi_04::new();
  $FORM{'_path_conf'} = &glib_cgi_04::param('_path_conf');
  # Ajusta path_conf para completar path y/o cambiar \ por /
  $FORM{'_path_conf'} = &lib_prontus::ajusta_pathconf($FORM{'_path_conf'});

  # Carga var. globales con los datos del arch. conf.
  &lib_prontus::load_config($FORM{'_path_conf'});   # Prontus 6.0
  $FORM{'_path_conf'} =~ s/^$prontus_varglb::DIR_SERVER//;

  if (&lib_prontus::open_dbm_files() ne 'ok') { # Prontus 6.0
    print "Content-Type: text/html\n\n";
    &glib_html_02::print_pag_result("Error","No fue posible abrir archivos de usuarios.");
    exit;
  };

  &show_recordarpass();

};

# ---------------------------------------------------------------
# SUB-RUTINAS.
# ---------------------------------------------------------------
sub show_recordarpass {
  my $perfil = $_[0];
  my $buf = &glib_fildir_02::read_file("$prontus_varglb::DIR_SERVER$prontus_varglb::DIR_CORE/prontus_olvidopass.html");
  # $buf =~ s/%%REL_PATH_PRONTUS%%/$prontus_varglb::RELDIR_BASE\/$prontus_varglb::PRONTUS_ID/isg;
  $buf =~ s/%%_PRONTUS_ID%%/$prontus_varglb::PRONTUS_ID/isg;
  $FORM{'_path_conf'} =~ s/^$prontus_varglb::DIR_SERVER//;
  $buf =~ s/%%_PATH_CONF%%/$FORM{'_path_conf'}/isg;

  print "Content-Type: text/html\n\n";
  print $buf;
};


# -------------------------------END SCRIPT----------------------

