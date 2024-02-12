import OpenAI from "openai";
import dotenv from "dotenv";
import events from "events";
import axios from "axios";
dotenv.config()

const openai = new OpenAI();

const apiKey = process.env.GPT_API_KEY;

const urlGPT = process.env.URL_CHAT

// scriptcraft/plugins/chatgpt.js

var chatGPT = {
    generarRespuesta: async function (mensajeDelJugador) {
        try {
            const mensajes = [
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": mensajeDelJugador },
            ];

            const respuesta = await axios.post(urlGPT, {
                messages: mensajes,
                model: "gpt-3.5-turbo",
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`, // Reemplaza con tu clave de API real
                },
            });

            return respuesta.data.choices[0].message.content;
        } catch (error) {
          console.error('Error al generar respuesta de ChatGPT:', error.message);
          return 'Lo siento, hubo un error al procesar tu solicitud.';
        }
      },
    };
    
    var interaccionConAldeano = {};
    
    events.playerInteractEntity(function (event) {
      var player = event.player;
      var entity = event.rightClicked;
    
      if (entity.type === 'VILLAGER') {
        abrirChatConAldeano(player, entity);
      }
    });
    
    function abrirChatConAldeano(player, aldeano) {
      player.sendMessage('Aldeano: ¡Hola aventurero! ¿Cómo puedo ayudarte hoy?');
      player.sendMessage('Escribe "/hablar" para empezar la conversación.');
    
      interaccionConAldeano[player.name] = {
        aldeano: aldeano,
        enConversacion: true,
      };
    
      events.on('player.Chat', function (event) {
        var jugador = event.sender;
        var mensaje = event.message;
    
        if (interaccionConAldeano[jugador.name] && interaccionConAldeano[jugador.name].enConversacion) {
          if (mensaje.toLowerCase() === '/hablar') {
            chatGPT.generarRespuesta('Hola, soy un aldeano hablador.')
              .then(respuestaChatGPT => {
                player.sendMessage('Aldeano: ' + respuestaChatGPT);
              })
              .catch(error => {
                console.error('Error al obtener respuesta de ChatGPT:', error);
                player.sendMessage('Aldeano: Parece que hay un problema. Intenta de nuevo más tarde.');
              });
          } else if (mensaje.toLowerCase() === 'chau') {
            // Terminar la conversación cuando el jugador dice "chau"
            player.sendMessage('Aldeano: ¡Hasta luego, aventurero!');
            interaccionConAldeano[jugador.name].enConversacion = false;
            // Limpia recursos adicionales o realiza otras acciones de término
          } else {
            // Maneja otros comandos o mensajes según sea necesario
          }
        }
      });
    
      // Registrar eventos adicionales según sea necesario para rastrear la ubicación del jugador
    
      // ...
    
      // Verificar la ubicación del jugador en intervalos regulares
      var verificarUbicacion = setInterval(function () {
        if (!interaccionConAldeano[player.name] || !interaccionConAldeano[player.name].enConversacion) {
          // Terminar la verificación si ya no está en conversación
          clearInterval(verificarUbicacion);
          return;
        }
    
        var distancia = player.location.distanceSquared(aldeano.location);
        if (distancia > 100) {
          // Terminar la conversación si el jugador se aleja demasiado
          player.sendMessage('Aldeano: Parece que te alejaste demasiado. ¡Hasta luego!');
          interaccionConAldeano[player.name].enConversacion = false;
          // Limpia recursos adicionales o realiza otras acciones de término
          clearInterval(verificarUbicacion);
        }
      }, 5000); // Verifica cada 5 segundos, puedes ajustar este intervalo según tus necesidades
    }