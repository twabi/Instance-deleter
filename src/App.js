import './App.css';
import React, {useEffect, useState} from "react";
import "mdbreact/dist/css/mdb.css";
import {
  MDBBox,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardText,
  MDBCardTitle,
  MDBCol,
  MDBContainer, MDBModal, MDBModalBody, MDBModalFooter, MDBModalHeader,
  MDBRow,
} from "mdbreact";
import {Select, Button, Dropdown, Menu, TreeSelect, Modal, Spin} from "antd";
import {getInstance} from "d2";
import Header from "@dhis2/d2-ui-header-bar"


const App = (props) => {

  var orgUnitFilters = ["Filter By", "Markets"];
  const basicAuth = "Basic " + btoa("ahmed:Atwabi@20");

  const [showLoading, setShowLoading] = useState(false);
  const [orgUnits, setOrgUnits] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchValue, setSearchValue] = useState();
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [orgFilter, setOrgFilter] = useState(orgUnitFilters[0]);
  const [choseFilter, setChoseFilter] = useState(false);
  const [treeMarkets, setTreeMarkets] = useState(null);
  const [treeValue, setTreeValue] = useState();
  const [flattenedUnits, setFlattenedUnits] = useState([]);
  const [D2, setD2] = useState();
  const [modal, setModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [message, setMessage] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [summary, setSummary] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  getInstance().then(d2 =>{
    setD2(d2);
  });

  const toggle = () => {
    setModal(!modal)
  }

  const toggleAlert = () => {
    setAlertModal(!alertModal);
  }

  useEffect(() => {
    setOrgUnits(props.organizationalUnits);
    setPrograms(props.programs);
    //setTreeMarkets(props.treeMarkets);

  },[summary, props.organizationalUnits, props.programs, props.d2, props.marketOrgUnits]);

  const handle = (value, label, extra) => {
    setSearchValue(value)
  };

  const onSelect = (value, node) => {
    //setSelectedOrgUnit(node);

    var children = extractChildren(node)
    var tempArray = [];
    if(children === undefined){
      tempArray.push(node);
      setFlattenedUnits(tempArray)
    } else {
      let flat = flatten(extractChildren(node), extractChildren, node.level, node.parent)
          .map(x => delete x.children && x);
      //console.log(flat)
      setFlattenedUnits(flat);
    }
  };

  let extractChildren = x => x.children;
  let flatten = (children, getChildren, level, parent) => Array.prototype.concat.apply(
      children && children.map(x => ({ ...x, level: level || 1, parent: parent || null })),
      children && children.map(x => flatten(getChildren(x) || [], getChildren, (level || 1) + 1, x.id))
  );

  const handleTree = (value, label, extra) => {
    setTreeValue(value)
    //console.log(value);
  };

  const onSelectTree = (value, node) => {
    //setOrgUnit(selectedOrgUnit => [...selectedOrgUnit, node]);
    //setSelectedOrgUnit(node);
    console.log(node);

    var children = extractChildren(node);

    if(children === undefined){
      setFlattenedUnits([node]);
    } else {
      let flat = flatten(extractChildren(node), extractChildren, node.level, node.parent)
          .map(x => delete x.children && x);
      //console.log(flat)
      setFlattenedUnits(flat);
    }
  };

  const handleProgram = selectedOption => {
    console.log(selectedOption);
    setSelectedProgram(selectedOption);
  };

  const deleteInstance = (enrol) => {

    var enrolID = enrol.trackedEntityInstance;
    var name = enrol.attributes[1].value;
    console.log(enrolID);
    fetch(`https://www.namis.org/main/api/trackedEntityInstances/${enrolID}`, {
      method: 'DELETE',
      headers: {
        'Authorization' : basicAuth,
        'Content-type': 'application/json',
      },
      credentials: "include"

    })
        .then(response => response.json())
        .then((result) => {
          console.log(result);
          setSummary(summary => [...summary, {"instance": enrolID, "name" : name, "message" : "Successfully deleted"}]);

        })
        .catch((error) => {
          setSummary(summary => [...summary, {"instance": enrolID, "name" : name, "message" : "Unable to delete due to an error" + error}]);

        });
  }

  const functionWithPromise = enrol => { //a function that returns a promise

    deleteInstance(enrol);
    return message;
  }

  const anAsyncFunction = async item => {
    return functionWithPromise(item)
  }

  const deleteData = async (list) => {
    return await Promise.all(list.map(item => anAsyncFunction(item)))
  }

  const handleDeletion = () => {
    //setShowLoad(true)
    setSummary([]);
    toggle();
    //setShowLoading(true);
    //var progID = selectedProgram.id;
    console.log(flattenedUnits)
    //console.log(progID);

    if(flattenedUnits.length !== 0  && selectedProgram.length !== 0){
      var programID = selectedProgram;

      var instances = [];

      flattenedUnits.map((unit, index) => {
        getInstance()
            .then((d2) => {
              const endpoint = `trackedEntityInstances.json?ou=${unit.id}&program=${programID}`;
              d2.Api.getApi().get(endpoint)
                  .then((response) => {
                    console.log(response.trackedEntityInstances);
                    instances = instances.concat(response.trackedEntityInstances);
                    //setEnrolArray(enrolArray => [...enrolArray, response.enrollments]);
                  })
                  .then(() => {
                    console.log(instances);
                    if(instances.length === 0){
                      setMessage("Alert");
                      setMessageBody("Unable to delete! No enrolments found for the chosen program or orgUnit.");
                      toggleAlert();
                    }
                    deleteData(instances).then((r) =>{
                      setShowLoading(false);
                      setShowLoad(false)
                      console.log(index, flattenedUnits.length);
                      //setShowLoad(false);
                      summary.length === 0 && index < flattenedUnits.length-3 ? setShowLoad(true) : setShowLoad(false);
                      setMessage("Operation Complete");
                      setMessageBody("A summary of Instances delete operation: ");
                      toggleAlert();
                    }).catch((err) => {
                      console.log("an error occurred: " + err);
                    });
                  })
                  .catch((error) => {
                    console.log(error);
                  });
            }).then(() => {

        });
      });

    } else {
      console.log("things are null");
      alert("fields cannot be left empty!!");
    }


  }


  const handleOrgFilter = (value) => {
    setOrgFilter(value);
    if(value === "Markets"){
      setChoseFilter(true);
      setFlattenedUnits([]);
      //setSelectedOrgUnit(null)
      setSearchValue(null);
      setTreeValue(null);
    } else {
      setChoseFilter(false);
      setFlattenedUnits([]);
      //setSelectedOrgUnit(null)
      setSearchValue(null);
      setTreeValue(null);
    }
  }


  const orgUnitMenu = (
      <Menu>
        {orgUnitFilters.map((item, index) => (
            <Menu.Item key={index} onClick={()=>{handleOrgFilter(item)}}>
              {item}
            </Menu.Item>
        ))}
      </Menu>
  );


  return (
      <div>
        {D2 && <Header className="mb-5" d2={D2}/>}
        <MDBBox className="mt-5" display="flex" justifyContent="center" >
          <MDBCol className="mb-5 mt-5" md="10">
            <MDBCard display="flex" justifyContent="center" className="text-xl-center w-100">
              <MDBCardBody>
                <MDBCardTitle>
                  <strong>Delete Tracked Entity Instances</strong>
                </MDBCardTitle>

                <MDBCardText>
                  <strong>Select instance Program and Org Unit(s)</strong>
                </MDBCardText>

                {programs.length == 0 ? <div className="spinner-border mx-2 indigo-text spinner-border-sm" role="status">
                  <span className="sr-only">Loading...</span>
                </div> : null}

                <MDBContainer>
                  <MDBModal isOpen={modal} toggle={toggle} centered>
                    <MDBModalHeader toggle={toggle}>Confirmation</MDBModalHeader>
                    <MDBModalBody>
                      All the Instances for the chosen orgUnit(and it's children-enrollments and event) will be deleted.
                      Are you sure you want to delete?
                    </MDBModalBody>
                    <MDBModalFooter>
                      <MDBBtn color="secondary" className="mx-1" onClick={toggle}>Cancel</MDBBtn>
                      <MDBBtn color="primary" className="mx-1" onClick={handleDeletion}>Delete</MDBBtn>
                    </MDBModalFooter>
                  </MDBModal>
                </MDBContainer>

                <MDBContainer>
                  <MDBModal isOpen={alertModal} toggle={toggleAlert} centered size="lg">
                    <MDBModalHeader toggle={toggleAlert}>{message}</MDBModalHeader>
                    <MDBModalBody>
                      <h4 className="mb-3">
                        {messageBody}
                      </h4>

                      {summary.map((item) => (
                          <MDBCard className="border-dark my-1">
                            <p>Instance: {item.name}</p>
                            <p>message: {item.message}</p>
                          </MDBCard>

                      ))}

                      {showLoad ? <div className="d-flex flex-column text-center">
                        <p className="font-italic">Loading</p>
                        <Spin size="large" />
                      </div> : summary.length === 0 ?<div>
                        <p>Found no instances to delete</p>
                      </div> : null}

                    </MDBModalBody>
                  </MDBModal>
                </MDBContainer>

                <hr/>

                <MDBContainer className="pl-5 mt-3">
                  <MDBRow>
                    <MDBCol>
                      <div className="text-left my-3 d-flex flex-column">
                        <label className="grey-text ml-2">
                          <strong>Select Program</strong>
                        </label>
                        <Select placeholder="select program option"
                                style={{ width: '100%' }}
                                size="large"
                                className="mt-2"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                filterSort={(optionA, optionB) =>
                                    optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                }
                                onChange={handleProgram}>
                          {programs.map((item, index) => (
                              <Select.Option key={index} value={item.id}>{item.label}</Select.Option>
                          ))}

                        </Select>

                      </div>
                    </MDBCol>
                    <MDBCol>

                      <div className="text-left my-3">
                        <label className="grey-text ml-2">
                          <strong>Select Organization Unit</strong>
                          {/*
                                                    <Dropdown overlay={orgUnitMenu} className="ml-3">
                                                        <Button size="small">{orgFilter} <DownOutlined /></Button>
                                                    </Dropdown>
                                                    */}

                        </label>

                        {choseFilter ?
                            <TreeSelect
                                style={{ width: '100%' }}
                                value={treeValue}
                                className="mt-2"
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto'}}
                                treeData={treeMarkets}
                                allowClear
                                size="large"
                                placeholder="Please select organizational unit"
                                onChange={handleTree}
                                onSelect={onSelectTree}
                                showSearch={true}
                            />
                            :
                            <TreeSelect
                                style={{ width: '100%' }}
                                value={searchValue}
                                className="mt-2"
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                treeData={orgUnits}
                                allowClear
                                size="large"
                                placeholder="Please select organizational unit"
                                onChange={handle}
                                onSelect={onSelect}
                                showSearch={true}
                            />

                        }

                      </div>
                    </MDBCol>
                  </MDBRow>

                  <MDBRow className="mt-4">

                  </MDBRow>

                </MDBContainer>

                <div className="text-center py-4 mt-2">

                  <MDBBtn color="cyan" className="text-white" onClick={() => {
                    setSummary([])
                    toggle();
                  }}>
                    Delete Instances{showLoading ? <div className="spinner-border mx-2 text-white spinner-border-sm" role="status">
                    <span className="sr-only">Loading...</span>
                  </div> : null}
                  </MDBBtn>
                </div>

              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBBox>
      </div>
  )
}

export default App;

