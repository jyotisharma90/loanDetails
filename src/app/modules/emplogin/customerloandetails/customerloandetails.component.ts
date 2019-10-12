import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppService } from '../../../helpers/services/app.service';
import { FileUploader } from 'ng2-file-upload/ng2-file-upload';
import { ColumnMode, SelectionType  } from '@swimlane/ngx-datatable';

const URL = 'http://localhost:3000/uploadFile';

declare var $;
@Component({
  selector: 'app-customerloandetails',
  templateUrl: './customerloandetails.component.html',
  styleUrls: ['./customerloandetails.component.scss']
})
export class CustomerloandetailsComponent implements OnInit {
  userType: string;
  rows= [];
  empId: string;
  cutomerDetials: any;
  selectForm: FormGroup;
  public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'files'});
  filename: any;
  loanStatus: any;
  old_status: any;
  selected = [];
  SelectionType = SelectionType;
  loan_id: any;
  constructor(private router: Router,private appService: AppService,private formBuilder: FormBuilder) { 
    
    this.userType = localStorage.getItem("usertype");
    this.empId = localStorage.getItem("userId");
    if(this.userType != '0'){
      this.router.navigateByUrl('/login');
    } 
    this.getAllLoanDetails()
  }

  ngOnInit() {
    // this.cutomerDetials = JSON.parse(localStorage.getItem("customerData"))
    // console.log(this.cutomerDetials["current_status"])
    this.getLoanStatus()
    this.selectForm = this.formBuilder.group({
      status: ['', Validators.required], 
      comment: ['']
    });

    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
         if(response){
           this.filename = response;
          alert('File uploaded successfully');
         }
     };

     
  }
  getAllLoanDetails(){
    this.appService.getAssignedLoanDetailsEmp(this.empId)
    .subscribe(
      (data: any) => {
        if (data.status) { 
          this.rows = data.assignedLoanToEmp;
          this.selected = [data[2]];
        }
      });
  }
  onSelect({ selected }) {
   // console.log('Select Event', selected, this.selected);
    this.old_status = selected[0].old_status;
    this.loan_id = selected[0].loan_id;
    this.selectForm.patchValue({    
      "status": selected[0].current_status,
      "comment":selected[0].comments
    });
  }

  
  clickSide(val){
    if(val == 'cdetails'){
      this.router.navigate(['/cutomerloandetails']);

    }
  }
  viewDeials(row){
    // console.log(row)
     localStorage.setItem('customerData',JSON.stringify(row))
     this.router.navigate(['/cutomerloandetails/viewdetails']);
   
  }
  
  togglemenu(){
    $("#wrapper").toggleClass("toggled");

  }
  getLoanStatus(){
    this.appService.loanStatus()
    .subscribe(
      (data: any) => {
        if (data.status) { 
           //console.log(data.loanStatus)
           this.loanStatus = data.loanStatus
           
        }
      });
  }
  get f() { 
    return this.selectForm.controls;
   }
  submitDetails(){
    var data={
      loan_id:this.loan_id,
      current_Status : this.f.status.value,
      old_Status : this.old_status,
      document : this.filename,
      comment : this.f.comment.value,
    }
    this.appService.updateLoanDetails(data)
    .subscribe(
      (data: any) => {
        if (data.status) { 
          // console.log(data.loanStatus)
            alert("Loan Details updated Successfully")
            this.router.navigate(['/cutomerloandetails']);

          }
      });
  }
}
