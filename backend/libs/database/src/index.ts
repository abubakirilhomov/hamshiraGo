// @app/database — re-export shared entities from api source
// New microservice apps import entities from here

// Core entities
export { User } from '../../../apps/api/src/users/entities/user.entity';
export { Medic } from '../../../apps/api/src/medics/entities/medic.entity';
export { MedicSchedule } from '../../../apps/api/src/medics/entities/medic-schedule.entity';
export { WithdrawalRequest } from '../../../apps/api/src/medics/entities/withdrawal-request.entity';
export { Order } from '../../../apps/api/src/orders/entities/order.entity';
export { OrderLocation } from '../../../apps/api/src/orders/entities/order-location.entity';
export { Doctor } from '../../../apps/api/src/consultations/entities/doctor.entity';
export { Consultation } from '../../../apps/api/src/consultations/entities/consultation.entity';
export { ChatMessage } from '../../../apps/api/src/consultations/entities/chat-message.entity';
export { Prescription } from '../../../apps/api/src/consultations/entities/prescription.entity';
export { Service } from '../../../apps/api/src/services/entities/service.entity';

// Clinic entities
export { Company } from '../../../apps/api/src/clinic/entities/company.entity';
export { CompanyBranch } from '../../../apps/api/src/clinic/entities/company-branch.entity';
export { CompanyUser } from '../../../apps/api/src/clinic/entities/company-user.entity';
export { CompanyRoom } from '../../../apps/api/src/clinic/entities/company-room.entity';
export { CompanyRoomDoctor } from '../../../apps/api/src/clinic/entities/company-room-doctor.entity';
export { CompanyService } from '../../../apps/api/src/clinic/entities/company-service.entity';
export { ClinicAppointment } from '../../../apps/api/src/clinic/entities/clinic-appointment.entity';
export { SalomatLead } from '../../../apps/api/src/clinic/entities/salomat-lead.entity';
export { ClinicPrescription } from '../../../apps/api/src/clinic/entities/clinic-prescription.entity';

// Payment entities
export { Payment } from '../../../apps/api/src/payments/entities/payment.entity';

// Voice agent entities
export { VoiceSession } from '../../../apps/api/src/voice-agent/entities/voice-session.entity';

// Other entities
export { Review } from '../../../apps/api/src/reviews/entities/review.entity';
export { FavoriteMedic } from '../../../apps/api/src/favorites/entities/favorite-medic.entity';
export { MedicalCard } from '../../../apps/api/src/medical-card/entities/medical-card.entity';
export { Referral } from '../../../apps/api/src/referrals/entities/referral.entity';
export { WebPushSubscription } from '../../../apps/api/src/realtime/entities/web-push-subscription.entity';
