import React from "react";
import {Form, Input, Button, Modal} from 'antd';
import {withBaseUrl} from "./index";
import {Text} from "evergreen-ui";

var url = "https://covmw.com/namisdemo/"

const LoginModal = () => {
    const [visible, setVisible] = React.useState(true);
    const [message, setMessage] = React.useState("");

    const onFinish = (values) => {
        setMessage("");
        //console.log('Success:', values);

        var username = values.username;
        var password = values.password;


        const basicAuth = "Basic " + btoa(username +":"+password);

        fetch(url+"api/programs", {
            method: 'GET',
            headers: {
                'Authorization' : basicAuth,
                'Content-type': 'application/json',
            },
            credentials: "include"

        }).then((response) => {
            console.log(response);
            if(response.status === 200){
                withBaseUrl(url+"api", basicAuth);
            } else if(response.status === 401){
                setMessage("Incorrect login credentials. Try again")
            }
        }).catch((error) =>{
            console.log(error);
        });
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <>
            <Modal visible={visible} footer={false} title={"Login to Server : " + url}>
                <div className="w-100 h-100 d-flex justify-content-center align-items-center">
                    <>
                        <Form
                            name="basic"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="Username"
                                name="username"
                                className="mt-2"
                                rules={[{ required: true, message: 'Please input your username!' }]}
                            >
                                <Input id="username"/>
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[{ required: true, message: 'Please input your password!' }]}
                            >
                                <Input.Password id="password"/>
                            </Form.Item>

                            <Form.Item wrapperCol={{ offset: 8, span: 16 }} className="d-flex flex-column">
                                <Button type="primary" htmlType="submit">
                                    Submit
                                </Button>

                            </Form.Item>
                            <Text className="text-danger text-center">{message}</Text>
                        </Form>
                    </>

                </div>
            </Modal>
        </>
    );
}

export default LoginModal;