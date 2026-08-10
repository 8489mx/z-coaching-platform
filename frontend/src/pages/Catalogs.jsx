import React, { useEffect, useRef } from 'react';

export default function Catalogs() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    let isMounted = true;
    

    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initScripts = async () => {
      if (!isMounted) return;
      try {
        await loadScript('/assets/libs/simple-datatables/umd/simple-datatables.js', 'catalogs-script-0');
        await loadScript('/assets/js/pages/datatable.init.js', 'catalogs-script-1');
      } catch (err) {
        console.error('Error loading scripts for Catalogs', err);
      }
    };
    initScripts();


    return () => {
      isMounted = false;
      const scriptIds = ['catalogs-script-0', 'catalogs-script-1'];
      scriptIds.forEach(id => {
        const scriptElement = document.getElementById(id);
        if (scriptElement) scriptElement.remove();
      });

    };
  }, []);

  const rawHTML = `
                    
                    <div class="row justify-content-center">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <div class="row align-items-center">
                                        <div class="col">                      
                                            <h4 class="card-title">Customers Details</h4>                      
                                        </div><!--end col-->
                                    </div>  <!--end row-->                                  
                                </div><!--end card-header-->
                                <div class="card-body pt-0">
                                    <div class="table-responsive">
                                        <table class="table datatable" id="datatable_1">
                                            <thead class="table-light">
                                              <tr>
                                                <th>Name</th>
                                                <th>Ext.</th>
                                                <th>City</th>
                                                <th data-type="date" data-format="YYYY/DD/MM">Start Date</th>
                                                <th>Completion</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Unity Pugh</td>
                                                    <td>9958</td>
                                                    <td>Curicó</td>
                                                    <td>2005/02/11</td>
                                                    <td>37%</td>
                                                </tr>
                                                <tr>
                                                    <td>Theodore Duran</td><td>8971</td><td>Dhanbad</td><td>1999/04/07</td><td>97%</td>
                                                </tr>
                                                <tr>
                                                    <td>Kylie Bishop</td><td>3147</td><td>Norman</td><td>2005/09/08</td><td>63%</td>
                                                </tr>
                                                <tr>
                                                    <td>Willow Gilliam</td><td>3497</td><td>Amqui</td><td>2009/29/11</td><td>30%</td>
                                                </tr>
                                                <tr>
                                                    <td>Blossom Dickerson</td><td>5018</td><td>Kempten</td><td>2006/11/09</td><td>17%</td>
                                                </tr>
                                                <tr>
                                                    <td>Elliott Snyder</td><td>3925</td><td>Enines</td><td>2006/03/08</td><td>57%</td>
                                                </tr>
                                                <tr>
                                                    <td>Castor Pugh</td><td>9488</td><td>Neath</td><td>2014/23/12</td><td>93%</td>
                                                </tr>
                                                <tr>
                                                    <td>Pearl Carlson</td><td>6231</td><td>Cobourg</td><td>2014/31/08</td><td>100%</td>
                                                </tr>
                                                <tr>
                                                    <td>Deirdre Bridges</td><td>1579</td><td>Eberswalde-Finow</td><td>2014/26/08</td><td>44%</td>
                                                </tr>
                                                <tr>
                                                    <td>Daniel Baldwin</td><td>6095</td><td>Moircy</td><td>2000/11/01</td><td>33%</td>
                                                </tr>  
                                                <tr>
                                                    <td>Pearl Carlson</td><td>6231</td><td>Cobourg</td><td>2014/31/08</td><td>100%</td>
                                                </tr>                                                                                        
                                            </tbody>
                                          </table>
                                    </div>   
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                                                        
                    </div><!--end row-->

                    <div class="row justify-content-center">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <div class="row align-items-center">
                                        <div class="col">                      
                                            <h4 class="card-title">Export Table</h4>                      
                                        </div><!--end col-->
                                    </div>  <!--end row-->                                  
                                </div><!--end card-header-->
                                <div class="card-body pt-0">
                                    <div class="table-responsive">
                                        <table class="table datatable" id="datatable_2">
                                            <thead class="">
                                            <tr>
                                                <th>Name</th>
                                                <th>Ext.</th>
                                                <th>City</th>
                                                <th data-type="date" data-format="YYYY/DD/MM">Start Date</th>
                                                <th>Completion</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Unity Pugh</td>
                                                    <td>9958</td>
                                                    <td>Curicó</td>
                                                    <td>2005/02/11</td>
                                                    <td>37%</td>
                                                </tr>
                                                <tr>
                                                    <td>Theodore Duran</td><td>8971</td><td>Dhanbad</td><td>1999/04/07</td><td>97%</td>
                                                </tr>
                                                <tr>
                                                    <td>Kylie Bishop</td><td>3147</td><td>Norman</td><td>2005/09/08</td><td>63%</td>
                                                </tr>
                                                <tr>
                                                    <td>Willow Gilliam</td><td>3497</td><td>Amqui</td><td>2009/29/11</td><td>30%</td>
                                                </tr>
                                                <tr>
                                                    <td>Blossom Dickerson</td><td>5018</td><td>Kempten</td><td>2006/11/09</td><td>17%</td>
                                                </tr>
                                                <tr>
                                                    <td>Elliott Snyder</td><td>3925</td><td>Enines</td><td>2006/03/08</td><td>57%</td>
                                                </tr>
                                                <tr>
                                                    <td>Castor Pugh</td><td>9488</td><td>Neath</td><td>2014/23/12</td><td>93%</td>
                                                </tr>
                                                <tr>
                                                    <td>Pearl Carlson</td><td>6231</td><td>Cobourg</td><td>2014/31/08</td><td>100%</td>
                                                </tr>
                                                <tr>
                                                    <td>Deirdre Bridges</td><td>1579</td><td>Eberswalde-Finow</td><td>2014/26/08</td><td>44%</td>
                                                </tr>
                                                <tr>
                                                    <td>Daniel Baldwin</td><td>6095</td><td>Moircy</td><td>2000/11/01</td><td>33%</td>
                                                </tr>  
                                                <tr>
                                                    <td>Pearl Carlson</td><td>6231</td><td>Cobourg</td><td>2014/31/08</td><td>100%</td>
                                                </tr>                                                                                        
                                            </tbody>
                                        </table>
                                        <button type="button" class="btn btn-sm btn-primary csv">Export CSV</button>
                                        <button type="button" class="btn btn-sm btn-primary sql">Export SQL</button>
                                        <button type="button" class="btn btn-sm btn-primary txt">Export TXT</button>
                                        <button type="button" class="btn btn-sm btn-primary json">Export JSON</button>
                                    </div>          
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                                                       
                    </div><!--end row-->                                        
                `;
  
  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: rawHTML }} />
  );
}
