var Transcoding, Msg, Flash;
(function () {
    "use strict";

    // -----------------------------------------------------------------------------
    // Objeto que sirve par la transcodificación
    Transcoding = {

        // Configuración
        panelVideo: '.panel-xcode',
        idVideo: '#linkVideo',
        panelStatus: '#panelStatus',

        dirCgi: './xcoding/',
        cgiCode: 'prontus_videoxcode.cgi',
        cgiStatus: 'prontus_videoxcodestatus.cgi',
        cgiSnap: 'prontus_videogetsnapshot.cgi',
        cgiCut: 'prontus_videocut.cgi',

        videoExtension: '.mp4',
        imageExtension: '.jpg',

        timeStatus: 2000,

        // Uso interno
        linkVideo: '',
        linkExt: '',
        linkImagen: '',
        linkImagenB: '',
        initialized: false,
        transcoding: false,

        // -------------------------------------------------------------------------
        init: function (idTab) {
            if ($(idTab + ' #xcodeInput').val() != 1) {
                return;
            }
            $(Transcoding.idVideo + ' a:first').each(function () {

                if (Transcoding.initialized) {
                    if(! Transcoding.transcoding) {
                        return;
                    }
                    Transcoding.reloadVideo();
                    return;
                }
                Transcoding.initialized = true;

                Transcoding.linkVideo = $(this).attr('href');
                Transcoding.linkExt = Transcoding.linkVideo.substr(Transcoding.linkVideo.lastIndexOf('.'));
                Transcoding.linkImagen = Transcoding.linkVideo.substr(0, Transcoding.linkVideo.lastIndexOf('.')) + Transcoding.imageExtension;
                var nameImg = Transcoding.linkImagen.substr(Transcoding.linkImagen.lastIndexOf('/') + 1);
                Transcoding.linkImagenB = '/' + Admin.prontus_id + '/cpan/procs/imgedit/' + nameImg;

                if (Transcoding.linkExt !== Transcoding.videoExtension) {
                    //alert('Transcoding.checkStatus');
                    Msg.setStatusMessage('Chequeando estado del video');
                    Transcoding.checkStatus();
                } else {
                    //alert('Transcoding.loadFlash');
                    Transcoding.loadFlash();
                }
            });
        },

        // -------------------------------------------------------------------------
        checkStatus: function () {
            $.ajax({
                url: Transcoding.dirCgi + Transcoding.cgiStatus,
                type: "post",
                dataType: 'text',
                data: {video: Transcoding.linkVideo, prontus_id: Admin.prontus_id},
                success: function (msg) {
                    if (msg == 'None') {
                        Msg.setStatusMessage('El video está siendo procesado');
                        Transcoding.procesarVideo();

                    } else if (msg == 'Busy') {
                        Transcoding.transcoding = true;
                        Msg.setStatusMessage('El video está siendo procesado');
                        setTimeout(function () {
                            Transcoding.checkStatus();
                        }, Transcoding.timeStatus);

                    } else if (msg == 'Ready') {
                        Transcoding.transcoding = false;
                        Msg.setInfoMessage('El video ya fue convertido.');
                        setTimeout(function () {
                            Transcoding.loadFlash();
                        }, 250);


                    } else {
                        Msg.setAlertMessage('Se ha producido un error al recuperar el Status:<br/> Respuesta no válida');
                    }
                },
                error:  function (msg) {
                    Msg.setAlertMessage('Se ha producido un error al recuperar el Status:<br/> ' + msg);
                }
            });
        },

        // -------------------------------------------------------------------------
        procesarVideo: function () {
            $.ajax({
                url: Transcoding.dirCgi + Transcoding.cgiCode,
                type: "post",
                dataType: 'json',
                data: {video: Transcoding.linkVideo, prontus_id: Admin.prontus_id},
                success: function (resp) {
                    if (typeof resp !== 'undefined' && typeof resp.status !== 'undefined') {
                        if (resp.status == '1') {
                            Msg.setStatusMessage('El video está siendo procesado');
                            Transcoding.transcoding = true;
                            setTimeout(function () {
                                Transcoding.checkStatus();
                            }, Transcoding.timeStatus);

                        } else {
                            Msg.setAlertMessage('Se ha producido un error al realizar la Conversión del Video:<br/> ' + resp.msg);
                        }

                    } else {
                        Msg.setAlertMessage('Se ha producido un error crítico al realizar la Conversión del Video:<br/> ' + resp);
                    }
                },
                error:  function (msg) {
                    Msg.setAlertMessage('Se ha producido un error en la respuesta Ajax:' + msg.responseText);
                }
            });
        },

        // -------------------------------------------------------------------------
        loadFlash: function () {
            if (Transcoding.linkExt !== Transcoding.videoExtension) {
                Transcoding.linkVideo = Transcoding.linkVideo.substr(0, Transcoding.linkVideo.lastIndexOf('.')) + Transcoding.videoExtension;
                Transcoding.linkExt = Transcoding.linkVideo.substr(Transcoding.linkVideo.lastIndexOf('.'));
                $(Transcoding.idVideo + ' a:first').attr('href', Transcoding.linkVideo);

                var nameVideo = Transcoding.linkVideo;
                nameVideo = nameVideo.substr(Transcoding.linkVideo.lastIndexOf('/') + 1);
                $(Transcoding.idVideo + " input[name^='_HIDD_']").val(nameVideo);
            }
            $(Transcoding.panelVideo).show();
            Flash.iniciaFlash('#player-content');
        },

        // -------------------------------------------------------------------------
        reloadVideo: function () {
            //alert('Flash.setMovie');
            Flash.setMovie(Transcoding.linkVideo);
        },

        // -------------------------------------------------------------------------
        generaScreenshot: function () {
            try {
                Msg.setStatusMessage('Generando la captura');
                var time = Flash.getPlayPoint();

                if (typeof time === 'undefined') {
                    if (Transcoding.transcoding === true) {
                        Msg.setAlertMessage('Debe esperar a que termine la conversión antes de extraer la captura');

                    } else if (Transcoding.linkVideo === '') {
                        Msg.setAlertMessage('Debe cargar un video antes de extraer la captura');

                    } else {
                        Msg.setAlertMessage('No se pudo leer el tiempo asociado a la Captura');
                    }
                } else {
                    $.ajax({
                        url: Transcoding.dirCgi + Transcoding.cgiSnap,
                        type: "post",
                        data: {t: time, video: Transcoding.linkVideo, prontus_id: Admin.prontus_id}, // w: Transcoding.wvideo, h: Transcoding.hvideo},
                        success: function (msg) {
                            if (msg === 'OK') {
                                Msg.setInfoMessage('La extracción de la captura ha finalizado');
                                setTimeout(function () {
                                    $('#_fotoeditada').val(Transcoding.linkImagenB);
                                    Fid.submitir('Guardar', '_self');
                                }, 500);
                            } else {
                                Msg.setAlertMessage('Se ha producido un error al extraer la Captura del Video:<br/> ' + msg);
                            }
                        },
                        error:  function (msg) {
                            Msg.setAlertMessage('Se ha producido un error al extraer la Captura del Video:<br/> ' + msg);
                        }
                    });
                }
            } catch (e) {
                Msg.setAlertMessage('Se ha producido un error al extraer la Captura del Video:<br/> ' + e);
            }
        },

        // -------------------------------------------------------------------------
        cortarVideo: function () {
            try {
                Msg.setStatusMessage('Generando el Corte del Video');
                var marcas = Flash.getMarkers();

                if (typeof marcas === 'undefined') {

                    if (Transcoding.transcoding === true) {
                        Msg.setAlertMessage('Debe esperar a que termine la conversión antes de poder editar');

                    } else if (Transcoding.linkVideo === '') {
                        Msg.setAlertMessage('Debe cargar un video antes de poder editar');

                    } else {
                        Msg.setAlertMessage('No se pudo obtener las marcas para cortar');
                    }
                } else {

                    if (marcas.length !== 2) {
                        Msg.setAlertMessage('El formato de las marcas entregado por el Flash no es válido');
                        return;
                    }
                    if (marcas[0] === 0 && marcas[1] === 0) {
                        Msg.setAlertMessage('Debe ingresar 1 o 2 marcas y presionar sobre el trozo<br/> de película que desee cortar');
                        return;
                    }

                    $.ajax({
                        url: Transcoding.dirCgi + Transcoding.cgiCut,
                        type: "post",
                        data: {t1: marcas[0], t2: marcas[1], video: Transcoding.linkVideo, prontus_id: Admin.prontus_id},
                        success: function (msg) {
                            if (msg === 'OK') {
                                Msg.setInfoMessage('El video ha sido cortado exitosamente');
                                setTimeout(function () {
                                    // Sólo para efectos de refresh
                                    Fid.submitir('Guardar', '_self');
                                }, 500);
                            } else {
                                Msg.setAlertMessage('Se ha producido un error al cortar el Video:<br/> ' + msg);
                            }
                        },
                        error:  function (msg) {
                            Msg.setAlertMessage('Se ha producido un error al cortar el Video:<br/> ' + msg);
                        }
                    });
                }
            } catch (e) {
                Msg.setAlertMessage('Se ha producido un error al cortar el Video:<br/> ' + e);
            }
        },

        // -------------------------------------------------------------------------
        validarVideo: function () {
            var file, idx, ext;

            file = $('#MULTIMEDIA_VIDEO1').val();
            if (file !== '') {
                idx = file.lastIndexOf('.');
                if (idx < 0) {
                    return 'El archivo no posee extensión';
                }
                ext = file.substr(idx);
                ext = ext.toLowerCase();

                if (ext !== '.avi' && ext !== '.flv' && ext !== '.mp4' && ext !== '.wmv' && ext !== '.mpg' && ext !== '.mpeg' && ext !== '.3gp' && ext !== '.mov') {
                    return 'El sistema sólo soporta archivos del tipo: avi, flv, mp4, wmv, mpg, mpeg, 3gp, mov';
                }

            }
            return '';
        },

        // -------------------------------------------------------------------------
        setFlashReady: function () {
            Flash.setMovie(Transcoding.linkVideo);
            return true;
        }
    };

    // -----------------------------------------------------------------------------
    //  Objeto encargado de mostrar los mensajes
    Msg = {

        imgAlert: '/cpan/core/imag/xcode/ico_alert.gif',
        imgInfo: '/cpan/core/imag/xcode/ico_info.gif',
        imgStatus: '/cpan/core/imag/loading.gif',

        // Funciones para los Estados y Mensajes
        setInfoMessage: function (msg) {
            var img = '<img src="/' + Admin.prontus_id + Msg.imgInfo + '" alt="Información" width="32" height="32" />';
            $(Transcoding.panelStatus).html(img + ' <div>' + msg + '</div>');
        },
        setStatusMessage: function (msg) {
            var img = '<img src="/' + Admin.prontus_id + Msg.imgStatus + '" alt="Cargando" width="32" height="32" />';
            $(Transcoding.panelStatus).html(img + ' <div>' + msg + '</div>');
        },
        setAlertMessage: function (msg) {
            var img = '<img src="/' + Admin.prontus_id + Msg.imgAlert + '" alt="Alerta" width="32" height="32" />';
            $(Transcoding.panelStatus).html(img + ' <div>' + msg + '</div>');
        }
    };

    // -----------------------------------------------------------------------------
    //  Objeto que ejecuta las funciones de internas del flash
    Flash = {

        movieObj: null,

        pooling: 0,
        maxPooling: 5,

        anchoPlayer: 440,
        altoPlayer: 350,

        playerVideo: '/cpan/core/flash/player_video/playerVideo.swf',
        playerId: 'idPlayer',
        playerName: 'playerVideoName',

        //Inicia el Flash del video, para que funcione en IE
        iniciaFlash: function (idDiv) {
            if (Flash.movieObj === null) {

                // Se inserta el player
                Flash.insertaPlayer(idDiv);

                // Para darle tiempo al flash para que se cargue
                setTimeout(function () {
                    Flash.movieObj = Flash.getObject();
                    //alert('iniciaFlash Flash.movieObj: ' + Flash.movieObj);
                }, 500);

            }
        },

        // Inserta el player según corresponda
        insertaPlayer: function (idDiv) {

            if(!jQuery.browser.flash) {
                $(idDiv).html('<video width="'+Flash.anchoPlayer+'" height="'+Flash.altoPlayer+'" controls="controls"></video>')
                        .find('video').append('<source src="'+Transcoding.linkVideo+'" type="video/mp4" />');
            } else {
                $(idDiv).media({
                    width: Flash.anchoPlayer,
                    height: Flash.altoPlayer,
                    src: '/' + Admin.prontus_id + Flash.playerVideo,
                    params: {
                        allowScriptAccess: 'always',
                        allowFullScreen: 'true',
                        wmode: 'opaque'
                        //quality: 'high'
                    },
                    attrs: {
                        id: Flash.playerId,
                        name: Flash.playerName
                    },
                    flashvars: {
                        XCOD: 'true'
                    }
                });
            }

        },

        // Obtiene el objeto movie
        getObject: function () {
            // Se obtiene el objeto
            var movieObj = window[Flash.playerName];
            if (typeof movieObj === 'undefined') {

                movieObj = document[Flash.playerName];
                if (typeof movieObj === 'undefined') {

                    movieObj = document.getElementById(Flash.playerId);
                }
            }
            if (typeof movieObj === 'undefined') {
                Msg.setAlertMessage('Se ha producido un error cargando el player de video.');
                movieObj = null;
            }
            return movieObj;
        },

        // Setea el archivo de video en el flash
        setMovie: function (linkVideo) {
            try {

                if(Admin.notFlash) {
                    return;
                }
                //alert('Flash.movieObj: ' + Flash.movieObj);
                if (Flash.movieObj === null) {
                    Flash.movieObj = Flash.getObject();
                }
                if (typeof Flash.movieObj.setMovie === 'function') {
                    Flash.movieObj.setMovie(linkVideo);
                    Flash.movieObj.setScreenshot();
                    Flash.pooling = 0;

                } else {
                    if (Flash.pooling > Flash.maxPooling) {
                        Msg.setAlertMessage('Error al invocar función del Flash setMovie()');
                        return;
                    }
                    setTimeout(function () {
                        Flash.setMovie(linkVideo);
                    }, 500);
                    Flash.pooling++;
                }
            } catch (e) {
                Msg.setAlertMessage('Error al invocar función del Flash setMovie():<br/> ' + e);
            }
        },
        // Obtiene el punto actual que se está reproduciendo
        getPlayPoint: function () {
            try {
                if (Flash.movieObj === null) {
                    return;
                }
                return Flash.movieObj.getPlayPoint();
            } catch (e) {
                Msg.setAlertMessage('Error al invocar función del Flash getPlayPoint():<br/> ' + e);
            }
        },
        // Coloca la marca A en el player
        setMarkerA: function () {
            try {
                if (Flash.movieObj === null) {
                    return;
                }
                Flash.movieObj.setMarkerA();
            } catch (e) {
                Msg.setAlertMessage('Error al invocar función del Flash setMarkerA():<br/> ' + e);
            }

        },
        // Coloca la marca B en el player
        setMarkerB: function () {
            try {
                if (Flash.movieObj === null) {
                    return;
                }
                Flash.movieObj.setMarkerB();
            } catch (e) {
                Msg.setAlertMessage('Error al invocar función del Flash setMarkerB():<br/> ' + e);
            }
        },
        // Obtiene las marcas inicio y fin del trozo seleccionado
        getMarkers: function () {

            try {
                if (Flash.movieObj === null) {
                    return;
                }
                var markers = Flash.movieObj.getMarkers();
                //alert(markers);
                return markers;

            } catch (e) {
                Msg.setAlertMessage('Error al invocar función del Flash getMarkers():<br/> ' + e);
            }
        }
    };
})();
