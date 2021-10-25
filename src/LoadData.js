import React, {Fragment, useState} from "react";
import {getInstance} from "d2";
import {Switch, Route} from "react-router-dom";
import App from "./App";


//initializing an array-to-tree library that will turn an array of org units into a tree form
var arrayToTree = require("array-to-tree");
const LoadData = (props) => {

    const [D2, setD2] = React.useState();
    const [initAuth, setInitAuth] = useState(props.auth);
    const [orgUnits, setOrgUnits] = React.useState([]);
    const [programs, setPrograms]= React.useState([]);
    const [markets, setMarkets] = React.useState([]);
    const [treeMarkets, setTreeMarkets] = React.useState([]);

    React.useEffect(() => {
        setInitAuth(props.auth);

        getInstance().then((d2) => {
            setD2(d2);
            const endpoint = "programs.json?paging=false";
            const unitEndpoint = "organisationUnits.json?paging=false&fields=name&fields=level&fields=id&fields=parent";
            const marketsEndPoint = "organisationUnitGroups/Lp9RVPodv0V.json?fields=organisationUnits[id,name,level,ancestors[id,name,level,parent]]";
            d2.Api.getApi().get(endpoint)
                .then((response) => {
                    //console.log(response.programs);

                    const tempArray = []
                    response.programs.map((item, index) => {
                        tempArray.push({"id" : item.id, "label" : item.displayName});
                    });
                    setPrograms(tempArray);
                })
                .catch((error) => {
                    console.log(error);
                    //alert("An error occurred: " + error);
                });

            d2.Api.getApi().get(unitEndpoint)
                .then((response) => {
                    console.log(response.organisationUnits)

                    response.organisationUnits.map((item, index) => {
                        //

                        //making sure every org unit has a parent node, if not set it to undefined
                        item.title = item.name;
                        item.value = item.name.replace(/ /g, "") + "-" + index;
                        if(item.parent != null){
                            //console.log(item.parent.id)
                            item.parent = item.parent.id
                        } else {
                            item.parent = undefined
                        }
                    });

                    //do the array-to-tree thing using the parent and id fields in each org unit
                    var tree = arrayToTree(response.organisationUnits, {
                        parentProperty: 'parent',
                        customID: 'id'
                    });

                    console.log(tree);
                    setOrgUnits(tree)

                })
                .catch((error) => {
                    console.log(error);
                    //alert("An error occurred: " + error);
                });

            d2.Api.getApi().get(marketsEndPoint)
                .then((response) => {
                    //console.log(response.organisationUnits);

                    const tempArray = []
                    response.organisationUnits.map((item) => {
                        tempArray.push({"id" : item.id, "label" : item.name})
                    });
                    setMarkets(tempArray);


                    //var tempVar = {};
                    var anotherArray = [];
                    response.organisationUnits.map((item, index) => {
                        item.title = item.name;
                        item.value = item.name.replace(/ /g, "") + "-" + index;
                        item.ancestors.map((ancestor, number) => {

                            if(ancestor.level === 3){
                                item.parent = ancestor.id
                                ancestor.parent = ""
                                ancestor.title = ancestor.name;
                                ancestor.value = ancestor.name.replace(/ /g, "") + "-" + (index+number);
                                anotherArray.push(ancestor);
                            } else if(ancestor.level === 1){
                                ancestor.parent = undefined;
                                ancestor.title = ancestor.name;
                                ancestor.value = ancestor.name.replace(/ /g, "") + "-" + (index+number);
                                //tempVar = ancestor;
                            }
                        });
                        if(item.parent != null){
                            //console.log(item.parent.id)
                            //item.parent = item.parent.id
                        } else {
                            item.parent = undefined
                        }
                    });

                    anotherArray = anotherArray.slice().filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

                    response.organisationUnits = response.organisationUnits.concat(anotherArray);
                    //response.organisationUnits.push(tempVar);

                    //do the array-to-tree thing using the parent and id fields in each org unit
                    var tree = arrayToTree(response.organisationUnits, {
                        parentProperty: 'parent',
                        customID: 'id'
                    });

                    setTreeMarkets(tree);
                    console.log(tree);

                })
                .catch((error) => {
                    console.log(error);
                    //alert("An error occurred: " + error);
                });
        });

    }, [props]);


    return (
            <Fragment>
                <Switch>
                    <Route path="/"  render={(props) => (
                        <App {...props}
                             auth={initAuth}
                             d2={D2}
                             programs={programs}
                             organizationalUnits={orgUnits}
                             marketOrgUnits={markets}
                        />
                    )} exact/>
                </Switch>
            </Fragment>
    );
}

export default LoadData;
