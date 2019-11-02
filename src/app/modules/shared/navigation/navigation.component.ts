import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppService } from '../../../helpers/services/app.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  activeTab: any;

  constructor(private route: ActivatedRoute,
    private router: Router,private appService: AppService) { }

  ngOnInit() {
    this.appService.activeTab.subscribe(data => {
      console.log(data);
      if(data){
        this.activeTab =data;
      }else{   
         this.activeTab ='elist';
      }
    
    })   
    //  var tab = localStorage.getItem('activeTab')
    // if(tab){
    //   this.activeTab =tab;
    // }else{   
    //    this.activeTab ='elist';
    // }
  }
  clickSide(val){
    localStorage.setItem("activeTab",val)
   // this.activeTab =val;
    if(val == 'elist'){
      this.router.navigate(['/emp-list']);

    }else if(val == 'xlupload'){
      this.router.navigate(['/xl-upload']);

    }else if(val == 'aloan'){
      this.router.navigate(['/assignLoanList']);

    }else if(val == 'oldxlupload'){
      this.router.navigate(['/oldxlupload']);

    }else if(val == 'repaymentdataupload'){
      this.router.navigate(['/repaymentupload']);

    }else if(val == 'reports'){
      this.router.navigate(['/reports']);

    }
  }
}