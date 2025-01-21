import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css']
})
export class ContactFormComponent {
  showWindow = false;
  contactForm: FormGroup;

  // Constructor que recibe FormBuilder y AuthService
  constructor(private fb: FormBuilder, private authService: AuthService, private route: Router) {
    // Inicializa el formulario de login usando FormBuilder
    this.contactForm = this.fb.group({
      Subject: [''],
      Body: [''],
    });
  }

  email: string = '';

  onSubmit() {
    const EmailData = {
      Subject: this.contactForm.value.Subject,
      Body: this.contactForm.value.Body,
    };

    // Confirmación extra antes de enviar el correo
    Swal.fire({
      title: "Are you sure you want to send this email?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Cancel",
      confirmButtonText: "Send"
    }).then((result: any) => {
      if (result.isConfirmed) {
        console.log("Llega aquí");

        this.email = this.authService.getUserEmail();

        this.authService.sendEmail(this.email, EmailData.Subject, EmailData.Body).subscribe(
          (data) => {
            console.log("Respuesta del backend:", data);
            Swal.fire({
              title: "Email Sent!",
              text: "The email was successfully sent.",
              icon: "success",
              confirmButtonText: "Ok"
            });
          },
          (error) => {
            console.error("Error en el envío del email:", error);
            Swal.fire({
              title: "Error!",
              text: "There was an error sending the email.",
              icon: "error",
              confirmButtonText: "Ok"
            });
          }
        );
      }
    });
  }

  toggleWindow(): void {
    this.showWindow = !this.showWindow;
  }
}
