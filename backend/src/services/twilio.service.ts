import twilio from 'twilio';
import { env } from '../config/env.js';

let twilioClient: any = null;

// Only initialize if Twilio is enabled and credentials are provided
if (env.TWILIO_ENABLED && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    console.log('✔ Twilio SMS client initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error);
  }
}

/**
 * Validates and formats a phone number to E.164 format.
 * Returns null if the phone number is invalid or empty.
 * Example of E.164: +12345678901
 */
export function formatToE164(phone: string): string | null {
  if (!phone) return null;
  
  // Remove non-numeric characters except '+'
  const clean = phone.replace(/[^\d+]/g, '');
  
  // Validate standard E.164 regex: starting with '+' followed by 10 to 15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  if (e164Regex.test(clean)) {
    return clean;
  }
  
  // Basic fallback: if it doesn't start with '+', but looks like a valid number, prepending '+'
  if (/^[1-9]\d{9,14}$/.test(clean)) {
    return `+${clean}`;
  }
  
  return null;
}

interface BookingSMSParams {
  customerName: string;
  bookingId: string;
  vehicleName: string;
  startDate: Date | string;
  endDate: Date | string;
}

export const twilioService = {
  /**
   * Generic sender wrapper with validations, checks, and error logging.
   * Fails gracefully (returns false) instead of throwing an error.
   */
  sendSMS: async (to: string, body: string): Promise<boolean> => {
    if (!env.TWILIO_ENABLED) {
      console.log('📢 Twilio SMS notifications are disabled in configuration.');
      return false;
    }

    if (!twilioClient) {
      console.warn('⚠️ Twilio client is not initialized. Please verify credentials in your .env file.');
      return false;
    }

    const formattedTo = formatToE164(to);
    if (!formattedTo) {
      console.error(`❌ SMS Failed: Recipient phone number "${to}" is not a valid E.164 format.`);
      return false;
    }

    try {
      const message = await twilioClient.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to: formattedTo,
      });
      console.log(`✅ SMS sent successfully to ${formattedTo}. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error(`❌ Twilio service error when sending SMS to ${formattedTo}:`, error);
      return false;
    }
  },

  /**
   * Sends booking confirmation text to the customer.
   */
  sendBookingConfirmationSMS: async (params: BookingSMSParams, phone: string): Promise<boolean> => {
    const formatDateTime = (dateVal: Date | string): string => {
      const d = new Date(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const hoursStr = String(hours).padStart(2, '0');
      
      return `${day} ${month} ${year} ${hoursStr}:${minutes} ${ampm}`;
    };

    const pickup = formatDateTime(params.startDate);
    const dropoff = formatDateTime(params.endDate);

    const messageBody = `Hello ${params.customerName}, your booking #${params.bookingId} for ${params.vehicleName} has been confirmed. Pickup: ${pickup}. Return: ${dropoff}. Thank you for choosing our service.`;

    return twilioService.sendSMS(phone, messageBody);
  },

  /**
   * Sends alert SMS to admins when a new booking is finalized.
   */
  sendAdminNotificationSMS: async (bookingId: string, vehicleName: string, totalPrice: number, adminPhone: string): Promise<boolean> => {
    const messageBody = `[Admin Alert] Booking #${bookingId} for ${vehicleName} is confirmed and paid. Total: $${totalPrice}.`;
    return twilioService.sendSMS(adminPhone, messageBody);
  }
};
