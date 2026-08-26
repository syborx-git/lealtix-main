import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ILealbotStepHandler, LealbotHandlerContext, LealbotStepResult } from './lealbot-step-handler.interface';
import { ConversationState } from '../models/lealbot.models';
import { LealbotService } from '../../../lealbot/services/lealbot.service';
import { LEALBOT_MESSAGES } from '../../../lealbot/lealbot-messages';

@Injectable({
  providedIn: 'root'
})
export class RegistrationFlowHandler implements ILealbotStepHandler {
  constructor(private lealbotService: LealbotService) {}

  public canHandle(state: ConversationState): boolean {
    return [
      ConversationState.INITIAL,
      ConversationState.WAITING_CONTACT,
      ConversationState.CUSTOMER_NEW
    ].includes(state);
  }

  public handle(input: string, context: LealbotHandlerContext): Observable<LealbotStepResult> {
    const currentState = context.currentState || ConversationState.INITIAL;

    switch (currentState) {
      case ConversationState.INITIAL:
        return this.handleInitialStep(input);

      case ConversationState.WAITING_CONTACT:
        return this.handleContactValidation(input, context);

      case ConversationState.CUSTOMER_NEW:
        return this.handleRegistrationStep(input, context);

      default:
        return of<LealbotStepResult>({
          botMessage: '¿En qué puedo ayudarte hoy?',
          nextState: ConversationState.BROWSING
        });
    }
  }

  private handleInitialStep(input: string): Observable<LealbotStepResult> {
    if (input.toLowerCase().includes('quizás') || input.toLowerCase() === 'close') {
      return of<LealbotStepResult>({
        botMessage: '¡Entendido! Estaré aquí cuando desees ordenar o consultar tus puntos.',
        nextState: ConversationState.ABANDONED
      });
    }

    return of<LealbotStepResult>({
      botMessage: LEALBOT_MESSAGES.ASKING_CONTACT.text,
      nextState: ConversationState.WAITING_CONTACT,
      inputType: 'CONTACT',
      inputPlaceholder: LEALBOT_MESSAGES.ASKING_CONTACT.placeholder,
      quickReplies: LEALBOT_MESSAGES.ASKING_CONTACT.quick_reply
    });
  }

  private handleContactValidation(contact: string, context: LealbotHandlerContext): Observable<LealbotStepResult> {
    const contactType = this.lealbotService.detectContactType(contact);

    if (!contactType) {
      return of<LealbotStepResult>({
        botMessage: 'Por favor, ingresa un número de teléfono a 10 dígitos o un correo válido.',
        nextState: ConversationState.WAITING_CONTACT,
        inputType: 'CONTACT',
        inputPlaceholder: 'Ej: 5512345678 o tu@correo.com'
      });
    }

    const payload: any = { tenantId: context.tenantId };
    if (contactType === 'email') payload.email = contact;
    if (contactType === 'phone') payload.phone = contact.replace(/\D/g, '');

    return this.lealbotService.validateCustomer(payload).pipe(
      map<any, LealbotStepResult>((res: any) => {
        const valData = res.object;
        if (valData && valData.exists && valData.customer) {
          const customer = valData.customer;
          const text = LEALBOT_MESSAGES.GREETING_RETURNING.text(customer.name);

          return {
            botMessage: text,
            nextState: ConversationState.CUSTOMER_IDENTIFIED,
            quickReplies: [
              { label: 'Ver Menú', value: 'MENU' },
              { label: 'Tengo un Cupón', value: 'COUPON' },
              { label: 'Lo de Siempre', value: 'LO_DE_SIEMPRE' }
            ],
            updatedCustomer: customer
          };
        }

        // Cliente nuevo
        const tempReg: any = { contactType };
        if (contactType === 'email') tempReg.email = contact;
        if (contactType === 'phone') tempReg.phone = contact.replace(/\D/g, '');

        return {
          botMessage: '¡Bienvenido! No te tenemos registrado aún. ¿Cómo te llamas para poder atenderte?',
          nextState: ConversationState.CUSTOMER_NEW,
          inputType: 'TEXT',
          inputPlaceholder: 'Tu nombre completo',
          updatedTempRegistration: tempReg
        };
      }),
      catchError(() => {
        return of<LealbotStepResult>({
          botMessage: 'Hubo un inconveniente al validar tus datos. ¿Podrías indicarme tu nombre para continuar?',
          nextState: ConversationState.CUSTOMER_NEW,
          inputType: 'TEXT',
          inputPlaceholder: 'Tu nombre completo',
          updatedTempRegistration: { name: '' }
        });
      })
    );
  }

  private handleRegistrationStep(input: string, context: LealbotHandlerContext): Observable<LealbotStepResult> {
    const temp = { ...context.tempRegistration };

    if (!temp.name) {
      temp.name = input;
      if (!temp.email) {
        return of<LealbotStepResult>({
          botMessage: `¡Mucho gusto, ${temp.name}! ¿Cuál es tu correo electrónico?`,
          nextState: ConversationState.CUSTOMER_NEW,
          inputType: 'EMAIL',
          inputPlaceholder: 'ejemplo@correo.com',
          updatedTempRegistration: temp
        });
      }
      if (!temp.phone) {
        return of<LealbotStepResult>({
          botMessage: '¿Cuál es tu número de teléfono (10 dígitos)?',
          nextState: ConversationState.CUSTOMER_NEW,
          inputType: 'PHONE',
          inputPlaceholder: '5512345678',
          updatedTempRegistration: temp
        });
      }
    }

    if (!temp.email && this.lealbotService.isValidEmail(input)) {
      temp.email = input;
    }

    if (!temp.phone && this.lealbotService.isValidPhone(input)) {
      temp.phone = input.replace(/\D/g, '');
    }

    if (!temp.gender) {
      if (['MASCULINO', 'FEMENINO', 'OTRO'].includes(input.toUpperCase())) {
        temp.gender = input.toUpperCase();
      } else {
        return of<LealbotStepResult>({
          botMessage: '¿Con qué género te identificas?',
          nextState: ConversationState.CUSTOMER_NEW,
          quickReplies: [
            { label: 'Masculino', value: 'MASCULINO' },
            { label: 'Femenino', value: 'FEMENINO' },
            { label: 'Otro', value: 'OTRO' }
          ],
          updatedTempRegistration: temp
        });
      }
    }

    if (!temp.birthDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input) || /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
        temp.birthDate = input;
      } else {
        return of<LealbotStepResult>({
          botMessage: '¿Cuál es tu fecha de nacimiento? (para enviarte promociones de cumpleaños)',
          nextState: ConversationState.CUSTOMER_NEW,
          inputType: 'DATE',
          inputPlaceholder: 'AAAA-MM-DD',
          updatedTempRegistration: temp
        });
      }
    }

    // Registro final en backend
    const regPayload = {
      tenantId: context.tenantId,
      name: temp.name || 'Cliente',
      email: temp.email || '',
      phone: temp.phone || '',
      gender: temp.gender,
      birthDate: temp.birthDate,
      acceptedPromotions: true
    };

    return this.lealbotService.registerCustomer(regPayload).pipe(
      map<any, LealbotStepResult>((res: any) => {
        const customer = res.object || {
          id: Date.now(),
          name: regPayload.name,
          email: regPayload.email,
          phone: regPayload.phone,
          active: true,
          acceptedPromotions: true
        };

        return {
          botMessage: `¡Listo, ${customer.name}! Tu registro ha sido exitoso 🎉. ¿Qué te gustaría ordenar hoy?`,
          nextState: ConversationState.BROWSING,
          quickReplies: [
            { label: 'Ver Menú', value: 'MENU' },
            { label: 'Tengo un Cupón', value: 'COUPON' }
          ],
          updatedCustomer: customer,
          updatedTempRegistration: {}
        };
      }),
      catchError(() => {
        return of<LealbotStepResult>({
          botMessage: 'Gracias por tus datos. Ya puedes explorar nuestro menú:',
          nextState: ConversationState.BROWSING,
          quickReplies: [{ label: 'Ver Menú', value: 'MENU' }],
          updatedTempRegistration: {}
        });
      })
    );
  }
}
