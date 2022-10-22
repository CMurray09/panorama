import {ValidationErrors, AbstractControl, ValidatorFn} from "@angular/forms";

export class RegisterValidators {
  static match(controlName: string, matchingControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null  => {
      const control:  AbstractControl<string, string> | null = group.get(controlName);
      const matchingControl:  AbstractControl<string, string> | null = group.get(matchingControlName);

      if (!control || !matchingControl) {
        console.error('Form controls cannot be found in the form group.');
        return { controlNotFound: false };
      }

      const error: {noMatch: boolean} | null = control.value === matchingControl.value ? null : { noMatch: true };
      matchingControl.setErrors(error);
      return error;
    }
  }
}
