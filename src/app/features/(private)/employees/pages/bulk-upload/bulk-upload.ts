import { Component } from '@angular/core';
import { BulkEmployeeUpload } from '../../components/bulk-employee-upload/bulk-employee-upload';

@Component({
  selector: 'app-add-employee',
  imports: [BulkEmployeeUpload],
  templateUrl: './bulk-upload.html',
})
export class BulkUploadEmployee {}
