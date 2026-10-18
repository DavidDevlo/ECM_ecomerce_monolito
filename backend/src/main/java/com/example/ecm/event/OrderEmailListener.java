package com.example.ecm.event;

import com.example.ecm.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class OrderEmailListener {

    private final EmailService emailService;

    // AFTER_COMMIT: si la transacción hace rollback, no sale ningún correo
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStatusChanged(OrderStatusChangedEvent e) {
        String subject;
        String intro;
        switch (e.status()) {
            case PENDING -> {
                subject = "Recibimos tu pedido #" + e.orderId();
                intro = "Recibimos tu pedido #" + e.orderId() + ". Realiza el pago por Yape, Plin o "
                        + "transferencia y envíanos el número de operación para confirmarlo.";
            }
            case PAID -> {
                subject = "Confirmamos tu pago del pedido #" + e.orderId();
                intro = "Verificamos tu pago. Pronto un vendedor preparará tu pedido.";
            }
            case SHIPPED -> {
                subject = "Tu pedido #" + e.orderId() + " va en camino";
                intro = "Tu pedido ya fue enviado.";
            }
            case DELIVERED -> {
                subject = "Tu pedido #" + e.orderId() + " fue entregado";
                intro = "Tu pedido fue entregado. Ya puedes dejar tu reseña de los productos.";
            }
            case CANCELLED -> {
                subject = "Tu pedido #" + e.orderId() + " fue cancelado";
                intro = "Tu pedido fue cancelado. Si ya habías pagado, contáctanos para coordinar el reembolso.";
            }
            default -> {
                return; // CONFIRMED y PREPARING son internos: no se notifican
            }
        }

        String total = e.total() != null ? "\nTotal: S/ " + e.total() : "";
        String body = "Hola " + e.customerName() + ",\n\n" + intro + total + "\n\nGracias por comprar en ECM.";
        emailService.send(e.customerEmail(), subject, body);
    }
}